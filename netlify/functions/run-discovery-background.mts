/**
 * Netlify Background Function — runs the Gemini discovery call.
 *
 * Background functions return 202 immediately and continue executing
 * for up to 15 minutes. This avoids the 10-30s timeout on serverless/edge.
 *
 * Triggered by POST /api/discover which calls:
 *   /.netlify/functions/run-discovery-background
 */

import type { Context } from "@netlify/functions";
import { createClient } from "@libsql/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Inline DB helpers (can't import from src/ in Netlify functions) ---

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function ensureTables(db: ReturnType<typeof getDb>) {
  try {
    await db.execute(`ALTER TABLE discovery_runs ADD COLUMN status TEXT DEFAULT 'complete'`);
  } catch { /* already exists */ }
  try {
    await db.execute(`ALTER TABLE discovery_runs ADD COLUMN error TEXT DEFAULT ''`);
  } catch { /* already exists */ }
}

async function getBrief(db: ReturnType<typeof getDb>) {
  const result = await db.execute("SELECT * FROM brief LIMIT 1");
  return result.rows[0] ?? null;
}

async function completeRun(
  db: ReturnType<typeof getDb>,
  runId: number,
  data: { prompt_used: string; raw_response: string; results_json: string; result_count: number }
) {
  await db.execute({
    sql: "UPDATE discovery_runs SET status = ?, prompt_used = ?, raw_response = ?, results_json = ?, result_count = ? WHERE id = ?",
    args: ["complete", data.prompt_used, data.raw_response, data.results_json, data.result_count, runId],
  });
}

async function failRun(db: ReturnType<typeof getDb>, runId: number, error: string) {
  await db.execute({
    sql: "UPDATE discovery_runs SET status = ?, error = ? WHERE id = ?",
    args: ["failed", error, runId],
  });
}

// --- Inline prompt builder (simplified — uses brief fields) ---

function buildPrompt(brief: Record<string, unknown>, query?: string, radiusMiles?: number): string {
  const geography = (brief.geography as string) || "Halifax, Nova Scotia";
  const radius = radiusMiles || (brief.radius_miles as number) || 15;
  const focusAreas = JSON.parse((brief.focus_areas as string) || "[]");
  const leadershipProblems = JSON.parse((brief.leadership_problems as string) || "[]");
  const nonNegotiables = JSON.parse((brief.non_negotiables as string) || "[]");
  const advisorBio = (brief.advisor_bio_summary as string) || "";

  const isHalifax = /halifax|nova scotia|atlantic canada/i.test(geography);

  let ecosystemRef = "";
  if (isHalifax) {
    ecosystemRef = `
ECOSYSTEM REFERENCE (Halifax / Nova Scotia):
Known orgs to check: COVE, Ocean Supercluster, Clearwater Seafoods, Dartmouth Ocean Technologies,
Innovasea, Cellula Robotics, Copperstone Technologies, Kraken Robotics, Ocean Frontier Institute,
Dalhousie University Ocean Sciences, Bedford Institute of Oceanography, Acadian Seaplants,
Shelburne Marine Terminal, Halifax Port Authority, Atlantic Towing, Maersk Atlantic Canada,
Nova Scotia Fisheries, Scotian Shelf Research, Ocean Tracking Network, CFIA Aquatic Animal Health,
Centre for Marine Applied Research, Perennia, pHathom Technologies, Voltai, Mara Renewables,
Smallfood, Clean Valley CIC, Alaagi, DeFort Bio.

INVESTORS, ACCELERATORS & NETWORKS:
Invest Nova Scotia, Build Ventures, Concrete Ventures, Propeller Ventures, S2G Ventures,
Katapult Ocean, BDC Capital, NBIF, NorthX, CDL-Atlantic Oceans Stream, Ocean Startup Project,
Canada's Ocean Supercluster, OTCNS, Ocean Tracking Network, COINAtlantic.`;
  } else {
    ecosystemRef = `
GEOGRAPHIC SEARCH INSTRUCTIONS for ${geography}:
Search broadly for ocean/marine/blue economy organizations within ${radius} miles.
Include: government agencies, research institutions, NGOs, private companies, startups,
industry associations, port authorities, and conservation groups.`;
  }

  return `You are a senior research analyst helping place a leadership advisor with ocean-focused organizations in ${geography}.

ADVISOR PROFILE:
${advisorBio}

SEARCH CRITERIA:
- Geography: ${geography} (within ${radius} miles)
- Focus areas: ${focusAreas.join(", ")}
- Leadership problems advisor solves: ${leadershipProblems.join(", ")}
- Non-negotiables: ${nonNegotiables.join(", ")}
${query ? `- Additional search query: ${query}` : ""}

SEARCH KEYWORDS:
ocean, marine, maritime, coastal, aquaculture, fisheries, seafood, blue economy, bluetech,
ocean technology, marine biotech, ocean carbon capture, ocean carbon removal, tidal energy,
wave energy, ocean energy, algae, microalgae, omega-3, marine ingredients, seaweed,
bioplastic marine, marine biomaterials, ocean AI, marine robotics, port, harbor, shipping,
naval, subsea, offshore, oceanographic, marine conservation, marine protected areas,
sustainable fishing, ocean governance, marine spatial planning, blue economy VC,
ocean impact investing, ocean startup

LEADERSHIP SIGNALS to look for:
- Recent leadership transition (new CEO, ED, board chair)
- Strategic pivot or expansion
- Major grant or funding received (seed, Series A)
- Partnership challenges or multi-stakeholder complexity
- Rapid growth creating organizational strain
- Major government contract awarded

${ecosystemRef}

Return EXACTLY a JSON array of objects. Each object must have these fields:
{
  "name": "Organization Name",
  "location": "City, State/Province",
  "website": "https://...",
  "estimated_size": 50,
  "estimated_budget": "$5M",
  "mission_focus": "What this org does in 1-2 sentences",
  "why_fit": "Why this is a fit for the advisor in 1-2 sentences",
  "keyword_category": "sector|infra|econ|sci|gov|cons|food",
  "signal_strength": "strong|moderate|emerging",
  "leadership_signal_tier": "confirmed|inferred|unknown",
  "leadership_signal_evidence": "Evidence for the leadership signal",
  "lat": 44.6488,
  "lng": -63.5752,
  "contact_name": "Real name from a verified public source, or empty string if not found",
  "contact_email": "Verified email from official website or press release, or empty string",
  "contact_position": "Verified title, or empty string",
  "contact_linkedin": "Real LinkedIn profile URL, or empty string",
  "contact_bio": "Brief bio from verified source, or empty string",
  "review_status": "Lead for Review",
  "host_producer_notes": "Any notable context"
}

CRITICAL — CONTACT ACCURACY RULES:
- ONLY include contact_name, contact_email, contact_position, and contact_bio if you found them from a VERIFIED public source (official website, LinkedIn, press release, news article)
- DO NOT fabricate or guess contact names. If you cannot find a real person's name, set contact_name to "" (empty string)
- DO NOT fabricate email addresses. If you cannot verify an email, set contact_email to "" (empty string)
- DO NOT include LinkedIn profile URLs — ALWAYS set contact_linkedin to "" (empty string). LinkedIn URLs are unreliable and will be generated separately.
- It is far better to return empty contact fields than to return invented ones

Find 15-25 organizations. Return ONLY the JSON array, no other text.`;
}

// --- Excluded/filter helpers ---

const EXCLUDED_ORGS = ["exxonmobil canada", "shell canada", "sbm offshore"];
const SINGLE_SPECIES_KW = ["salmon-only", "lobster-only", "lobster harvester", "tuna fishery", "whale conservation", "sea turtle rescue", "sea turtle"];
const FRESHWATER_KW = ["lake", "river", "freshwater", "great lakes"];
const OCEAN_KW = ["ocean", "marine", "maritime", "coastal", "sea"];

function filterAndEnrichResults(results: Record<string, unknown>[]): Record<string, unknown>[] {
  return results
    .filter((r) => {
      const name = ((r.name as string) || "").toLowerCase();
      const mission = ((r.mission_focus as string) || "").toLowerCase();
      if (EXCLUDED_ORGS.some((e) => name.includes(e))) return false;
      if (SINGLE_SPECIES_KW.some((kw) => name.includes(kw) || mission.includes(kw))) return false;
      const hasFreshwater = FRESHWATER_KW.some((kw) => mission.includes(kw));
      if (hasFreshwater && !OCEAN_KW.some((kw) => mission.includes(kw))) return false;
      if (!r.name || !r.mission_focus) return false;
      return true;
    })
    .map((r) => {
      // Generate a LinkedIn search link from contact name + city (simple terms work best)
      let linkedinUrl = "";
      const contactName = r.contact_name as string;
      if (contactName) {
        const city = ((r.location as string) || "").split(",")[0].trim();
        const searchTerms = [contactName, city].filter(Boolean).join(" ");
        linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchTerms)}`;
      }
      return { ...r, contact_linkedin: linkedinUrl };
    });
}

// --- Main handler ---

export default async function handler(req: Request, _context: Context) {
  console.log("[bg-discovery] Background function started");

  const db = getDb();

  try {
    const body = await req.json();
    const { runId, query, radiusMiles } = body;

    console.log(`[bg-discovery] Processing run ${runId}, query: ${query}, radius: ${radiusMiles}`);

    await ensureTables(db);

    const brief = await getBrief(db);
    if (!brief) {
      await failRun(db, runId, "No advisory brief found");
      return new Response("No brief", { status: 400 });
    }

    // Build prompt
    const prompt = buildPrompt(brief, query, radiusMiles);

    // Call Gemini
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      await failRun(db, runId, "GOOGLE_GEMINI_API_KEY not set");
      return new Response("No API key", { status: 500 });
    }

    console.log("[bg-discovery] Calling Gemini...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} } as never],
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log(`[bg-discovery] Gemini returned ${responseText.length} chars`);

    // Parse results
    let results: Record<string, unknown>[] = [];
    try {
      const cleaned = responseText.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("[bg-discovery] Failed to parse:", responseText.substring(0, 200));
    }

    results = filterAndEnrichResults(results);

    // Save to Turso
    await completeRun(db, runId, {
      prompt_used: prompt,
      raw_response: responseText,
      results_json: JSON.stringify(results),
      result_count: results.length,
    });

    console.log(`[bg-discovery] Run ${runId} complete with ${results.length} results`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[bg-discovery] Error:", error);
    try {
      const body = await req.clone().json().catch(() => ({ runId: 0 }));
      if (body.runId) {
        await failRun(db, body.runId, message);
      }
    } catch { /* ignore */ }
    return new Response(message, { status: 500 });
  }
}

export const config = {
  path: "/.netlify/functions/run-discovery-background",
};
