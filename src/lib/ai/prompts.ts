import type { Brief, Organization, Note } from '../db/types';

function briefToContext(brief: Brief): string {
  const focusAreas = JSON.parse(brief.focus_areas || '[]');
  const problems = JSON.parse(brief.leadership_problems || '[]');
  const nonNeg = JSON.parse(brief.non_negotiables || '[]');

  return `
ADVISOR BRIEF:
- Geography: ${brief.geography}
- Search Radius: ${brief.radius_miles} miles
- Placement Start: ${brief.placement_start}
- Placement Duration: ${brief.placement_duration_weeks} weeks
- Focus Areas: ${focusAreas.join(', ')}
- Leadership Problems She Solves: ${problems.join(', ')}
- Non-Negotiables: ${nonNeg.join(', ')}
${brief.win_win_win_criteria ? `- Win-Win-Win Criteria: ${brief.win_win_win_criteria}` : ''}

ABOUT THE ADVISOR (LESLIE):
${brief.advisor_bio_summary || 'Nearly 20 years helping tech executives create happier teams, aligned outcomes, and stronger ROI. Now transitioning to ocean conservation / blue economy leadership advisory. Specializes in: stuck partnerships, alignment issues, truth-telling gaps, strategic knots.'}
- Works best 1:1 with senior leaders or with top teams on defined missions
- Looking for a 6-8 week Entrepreneurship in Residence placement
- Offering condensed senior advisory (equivalent of a year-long engagement in 2 months)
- Best fit: organizations creating win-win-wins for corporations, nature, and future generations
- Includes: for-profit companies, non-profits, NGOs, public-private partnerships, social enterprises, research institutions — any organization type
`.trim();
}

export function buildDiscoveryPrompt(brief: Brief, customQuery?: string, radiusMiles?: number): string {
  const context = briefToContext(brief);
  const radius = radiusMiles || brief.radius_miles || 15;

  // Block 1: Role definition
  // Block 2: Advisor context (injected via briefToContext)
  // Block 3: Brief criteria
  // Block 4: Hard filter declaration (qualitative only)
  // Block 5: Keyword search strategy
  // Block 6: Leadership signal tier instruction
  // Block 7: Exclusion rules
  // Block 8: Ecosystem reference
  // Block 9: Output format spec
  // Block 10: Count and quality instruction

  return `You are a senior research analyst supporting a leadership advisor who is seeking a 6-8 week Entrepreneurship in Residence placement in Halifax, Nova Scotia. Your task is to find real, qualified ocean-focused organizations using web search.

${context}

GEOGRAPHY CONSTRAINT:
- Primary location: ${brief.geography}
- Search radius: within ${radius} miles of ${brief.geography}
- Only include organizations headquartered or with major operations within this radius

SEARCH TASK:
${customQuery ? `Search for: "${customQuery}"` : `Find ocean-focused organizations within ${radius} miles of ${brief.geography}. Include ALL types: companies, non-profits, research institutions, NGOs, public-private partnerships, Crown corporations.`}

HARD FILTERS — Qualitative Exclusions Only:
- EXCLUDE: Any organization that operates exclusively on a single marine species (salmon-only farms, lobster harvesters, tuna fisheries, whale conservation, sea turtle rescue)
- EXCLUDE: Any freshwater organization (lakes, rivers, freshwater fisheries)
- EXCLUDE: ExxonMobil Canada, Shell Canada, SBM Offshore (enterprise-scale oil & gas — placement impractical)
- Do NOT use the broad keyword 'offshore' — use 'offshore wind' only
- Budget and headcount are NOT exclusion criteria — return all qualifying organizations regardless of size

KEYWORD SEARCH STRATEGY — Two-Axis Search:
Search for organizations using ANY of these sector terms:

PRIMARY (Sector Synonyms): ocean, marine, maritime, blue economy, oceanographic, offshore wind, subsea, coastal

ECONOMIC FRAMING: blue finance, ocean economy, marine commerce, ocean investment, investing in ocean, ocean-focused fund, marine investment, ocean venture, sustainable seafood investment, coastal economy investment, ocean-focused accelerator

INFRASTRUCTURE & OPERATIONS: marine infrastructure, offshore wind operations, offshore wind development, shipbuilding, naval architecture, port authority, marine logistics, harbour management, underwater systems, marine engineering

SCIENCE & DEEP TECHNOLOGY: ocean technology, oceanography, marine science, AUV, ROV, underwater acoustics, hydrography, bathymetry, ocean intelligence, marine sensing, seabed mapping, ocean data

CONSERVATION & SUSTAINABILITY: ocean stewardship, marine conservation, ocean health, blue carbon, coastal resilience, marine protected areas, ocean sustainability, ocean governance

GOVERNANCE & POLICY: marine spatial planning, ocean policy, coastal management, fisheries management (broad-mandate only), marine regulatory, EEZ

FOOD SYSTEMS (handle with care — enforce single-species exclusion): aquaculture (multi-species only), mariculture, sustainable seafood, seafood supply chain, blue food

ALSO PRIORITIZE organizations showing these LEADERSHIP SIGNALS:
founder-led scaling, hypergrowth, cross-sector partnership, strategic transition, joint venture, public-private partnership, multi-stakeholder, organizational alignment, board transition, scaling culture

GEOGRAPHIC NOTE: Always pair economic/investment terms with Halifax, Nova Scotia, or Atlantic Canada.

LEADERSHIP SIGNAL TIER INSTRUCTION:
For every organization returned, assess and report a leadership_signal_tier value:
- Use 'confirmed' if you found specific, dateable evidence of a leadership challenge (news article about rapid hiring, founder transition announcement, partnership press release, job posting for Chief People Officer, board change filing)
- Use 'inferred' if the org's profile strongly implies a current leadership challenge without direct evidence (recent significant funding round, newly commercialized product, recently expanded government mandate, recent merger/restructure)
- Use 'unknown' if you could not find sufficient public information to assess leadership challenges

CRITICAL DISTINCTION: 'unknown' means the data does not exist to assess — it does NOT mean no leadership challenge exists. Low public profile ≠ no leadership challenge. Never conflate absence of data with absence of challenge. All three tiers are included in results; 'unknown' is never an exclusion reason.

For 'unknown' tier, set leadership_signal_evidence to: 'Insufficient public data to assess leadership challenges. Recommend direct outreach to verify organizational context before pursuing.'

EXCLUSION RULES (reinforced):
- No single-species operations: salmon-only, lobster-only, tuna-only, shrimp-only, whale conservation, sea turtle rescue
- No freshwater organizations: lake research, river conservation, freshwater fisheries
- No organizations outside ${radius} miles of ${brief.geography}
- Do NOT confuse 'no public data found' with 'no leadership challenges detected'

HALIFAX OCEAN ECOSYSTEM REFERENCE:
Cross-reference these known Nova Scotia ocean sector organizations when searching. Include them if they meet criteria, and search for additional qualifying organizations beyond this list:

OCEAN TECH & SCIENCE:
- Kraken Robotics — subsea technology, sonar, AUVs
- Kongsberg Maritime Canada — maritime sensors and systems
- GeoSpectrum Technologies — underwater acoustics
- Innovasea — ocean tracking and aquaculture technology
- JASCO Applied Sciences — ocean acoustics, environmental monitoring
- AML Oceanographic — oceanographic instruments
- Ultra Electronics Maritime Systems — defence and marine electronics
- General Dynamics Canada — defence and ocean systems
- Lockheed Martin Canada — defence, maritime surveillance
- metOcean Telematics — ocean data buoys and telemetry
- Fugro GeoSurveys — seabed mapping, geophysical survey
- MDA (MacDonald Dettwiler) — satellite intelligence and earth observation
- DSM Nutritional Products — marine ingredients/omega-3s
- Acadian Seaplants — seaweed / marine agriculture
- Ocean Sonics — hydrophones and marine acoustics
- MacArtney Underwater Technology — underwater connectors and systems
- CarteNav Solutions — maritime surveillance software
- Deep Vision Inc. — underwater imaging and inspection

OCEAN INFRASTRUCTURE & ENERGY:
- Irving Shipbuilding — federal shipbuilding ($29.3B contract), Halifax
- Babcock Canada — naval engineering and ship lifecycle support
- FORCE (Fundy Ocean Research Centre for Energy) — tidal energy R&D
- SNC-Lavalin — engineering, ocean infrastructure projects
- ABCO Industries — marine fabrication

DO NOT PURSUE (out of scope):
- SBM Offshore — oil & gas production systems; enterprise scale
- ExxonMobil Canada — offshore oil & gas major
- Shell Canada — offshore energy exploration

TRANSPORTATION & LOGISTICS:
- Port of Halifax / Halifax Port Authority — major Atlantic port
- Halterm Container Terminal — port operations
- Atlantic Towing — offshore marine services
- Secunda Canada — offshore marine and oil field services
- Horizon Maritime Services — offshore vessel support
- Oceanex — marine shipping, Atlantic Canada

FISHERIES (broad ocean operations only):
- High Liner Foods — global seafood processing, HQ Lunenburg NS
- Clearwater Seafoods — premium shellfish, national and international scale

EDUCATION & RESEARCH:
- Bedford Institute of Oceanography (BIO) — federal ocean research, Dartmouth NS
- Dalhousie University — Faculty of Science, ocean/marine programs
- DRDC Atlantic — Defence Research & Development Canada, maritime focus
- National Research Council Canada (NRC) — ocean science and engineering
- COVE (Centre for Ocean Ventures & Entrepreneurship) — Halifax ocean innovation hub

NETWORKS & ASSOCIATIONS:
- OTCNS (Ocean Technology Council of Nova Scotia)
- Ocean Tracking Network — Dalhousie, global ocean monitoring
- COINAtlantic — Coastal and Ocean Information Network Atlantic

OUTPUT FORMAT:
Return your results as a JSON array with this exact structure. Include both organization fields AND lead contact fields:
[
  {
    "name": "Organization Name",
    "location": "City, Province (or full address)",
    "website": "https://...",
    "estimated_size": 100,
    "estimated_budget": "$50M",
    "mission_focus": "Brief description of their mission...",
    "why_fit": "Why this org is a fit for the advisor...",
    "keyword_category": "sector",
    "signal_strength": "high",
    "leadership_signal_tier": "confirmed",
    "leadership_signal_evidence": "Specific evidence found: recently announced...",
    "lat": 44.6488,
    "lng": -63.5752,
    "contact_name": "Jane Smith",
    "contact_email": "jsmith@org.com",
    "contact_position": "CEO and Executive Director",
    "contact_linkedin": "https://linkedin.com/in/janesmith",
    "contact_bio": "15 years in ocean technology, previously led...",
    "review_status": "Lead for Business",
    "host_producer_notes": "Strong fit — $50M budget, ocean-wide mission, leadership transition underway"
  }
]

FIELD NOTES:
- keyword_category: one of "sector", "infra", "econ", "sci", "gov", "cons", "food" — which cluster best describes this org. Use "cons" for conservation/sustainability orgs. Use "food" for aquaculture, seafood supply chain, and blue food orgs.
- signal_strength: one of "high", "strong", "supplemental", "careful" — how strong a lead for Leslie
- leadership_signal_tier: one of "confirmed", "inferred", "unknown" — evidence quality for leadership challenge
- leadership_signal_evidence: 1-3 sentences describing specific evidence or standard 'insufficient data' note
- lat/lng: approximate coordinates for Halifax-area mapping (decimal degrees)
- review_status: one of "Lead for Business", "Lead for Review", "Pending Review", "Do NOT Contact"

COUNT AND QUALITY:
Return between 10 and 15 results. Prefer verified organizations with web-searchable evidence over speculative results. Do not return fewer than 10 results. Distribute across all three signal tiers — do not exclude unknown-tier orgs to meet a count target. Sort by estimated budget (high to low) with signal tier as tiebreaker.

Return ONLY the JSON array, no other text.`;
}

export function buildOutreachPrompt(brief: Brief, org: Organization, contact: { contact_name: string; contact_position: string; contact_bio?: string }): string {
  const briefContext = briefToContext(brief);

  return `Write this email as a warm third-party connector who knows both the organization's work and Leslie personally. Do NOT write in Leslie's first-person voice. Do NOT write as a generic AI assistant.

${briefContext}

ORGANIZATION:
- Name: ${org.name}
- Location: ${org.location}
- Mission: ${org.mission_focus}
- Why They're a Fit: ${org.why_fit}
- Website: ${org.website}

CONTACT:
- Name: ${contact.contact_name}
- Position: ${contact.contact_position}
${contact.contact_bio ? `- Bio: ${contact.contact_bio}` : ''}

EMAIL STRUCTURE (follow this sequence exactly):
1. Acknowledge the organization's specific work in 1-2 sentences (reference something real about their mission or recent achievements)
2. Introduce Leslie via the PROBLEM she solves — not via her biography or credentials. Avoid: 'Leslie has 20 years of experience.' Prefer: 'Leslie works with organizations navigating [specific challenge].'
3. Frame the engagement: 6-8 week condensed advisory placement, low commitment, high value
4. One clear ask: a 30-minute introductory call

CONSTRAINTS:
- 250-350 words total
- No salesy language, no urgency pressure, no corporate jargon
- Warm, collegial, direct
- Specific to this organization — do not write a generic email
- Write in the connector's voice, NOT Leslie's voice
- Make it feel like a personal recommendation, not a pitch

Return the email body text only. Include a subject line on the first line prefixed with "Subject: ". Ready to copy-paste.`;
}

export function buildBriefingPrompt(brief: Brief, org: Organization, notes: Note[]): string {
  const briefContext = briefToContext(brief);
  const notesText = notes.map(n => `[${n.type}] ${n.content}`).join('\n');

  return `Search for current, verified information about ${org.name}. Prioritize: recent news, leadership changes, published reports, press releases, and funding announcements from the past 18 months.

${briefContext}

ORGANIZATION:
- Name: ${org.name}
- Location: ${org.location}
- Website: ${org.website}
- Size: ~${org.estimated_size} people
- Budget: ${org.estimated_budget}
- Mission: ${org.mission_focus}
- Why Fit: ${org.why_fit}
${org.leadership_signal_tier ? `- Leadership Signal: ${org.leadership_signal_tier} — ${org.leadership_signal_evidence}` : ''}

EXISTING NOTES:
${notesText || 'No notes yet.'}

Create a briefing note with exactly these 6 sections, in this order. Write in complete sentences — no bullet points within sections. Sections should flow as briefing notes, not a Q&A list.

## Organization Background
What they do, scale, key programs, notable recent developments (3-5 sentences).

## Leadership Signal
Specific evidence of the type of leadership challenge Leslie addresses. Reference actual events, transitions, or statements if found (2-3 sentences).

## Key People
2-3 individuals: name, current title, 1-2 sentence bio. Prioritize: CEO, ED, VP of the relevant function.

## Recommended Meeting Ask
One specific outcome Leslie should target in this conversation. What would make this meeting a clear success?

## Talking Points
3-4 concrete openers or discussion hooks drawn from the org's current situation, recent news, or known strategic context.

## Watch For
1-3 potential red flags: cultural misalignment, budget constraints, mandate mismatch, or signs the leadership challenge is beyond a 6-8 week scope.

Keep the tone practical and direct. Leslie should walk in feeling prepared and confident.`;
}
