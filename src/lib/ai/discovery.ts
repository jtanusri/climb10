import { getGeminiModelWithSearch } from './client';
import { buildDiscoveryPrompt } from './prompts';
import { createDiscoveryRun } from '../db/discovery';
import type { Brief, BudgetTier, KeywordCategory, SignalStrength, LeadershipSignalTier } from '../db/types';
import { parseBudgetToMillions } from '../utils/budget';
import { getBudgetTier } from '../db/types';

export interface DiscoveryResult {
  // Organization fields
  name: string;
  location: string;
  website: string;
  estimated_size: number | string;
  estimated_budget: string;
  budget_tier?: BudgetTier;
  mission_focus: string;
  why_fit: string;
  keyword_category?: KeywordCategory | '';
  signal_strength?: SignalStrength | '';
  leadership_signal_tier: LeadershipSignalTier;
  leadership_signal_evidence: string;
  lat?: number;
  lng?: number;
  // Lead contact fields (PodTechs format)
  contact_name: string;
  contact_email: string;
  contact_position: string;
  contact_linkedin?: string;
  contact_bio?: string;
  review_status: 'Lead for Review' | 'Lead for Business' | 'Do NOT Contact' | 'Pending Review';
  host_producer_notes?: string;
}

// Excluded org names — enterprise-scale oil & gas, out of scope
const EXCLUDED_ORGS = ['exxonmobil canada', 'shell canada', 'sbm offshore'];

// Single-species keywords for hard filter
const SINGLE_SPECIES_KEYWORDS = [
  'salmon-only', 'lobster-only', 'lobster harvester', 'tuna fishery',
  'whale conservation', 'sea turtle rescue', 'sea turtle',
];

// Freshwater keywords for hard filter
const FRESHWATER_KEYWORDS = ['lake', 'river', 'freshwater', 'great lakes'];
const OCEAN_CONTEXT_KEYWORDS = ['ocean', 'marine', 'maritime', 'coastal', 'sea'];

// parseBudgetToMillions is imported from ../utils/budget

function isExcludedOrg(name: string): boolean {
  const lower = name.toLowerCase();
  return EXCLUDED_ORGS.some(exc => lower.includes(exc));
}

function isSingleSpecies(missionFocus: string, name: string): boolean {
  const text = `${name} ${missionFocus}`.toLowerCase();
  return SINGLE_SPECIES_KEYWORDS.some(kw => text.includes(kw));
}

function isFreshwater(missionFocus: string): boolean {
  const lower = missionFocus.toLowerCase();
  const hasFreshwater = FRESHWATER_KEYWORDS.some(kw => lower.includes(kw));
  if (!hasFreshwater) return false;
  // Allow if ocean/marine context is also present
  const hasOceanContext = OCEAN_CONTEXT_KEYWORDS.some(kw => lower.includes(kw));
  return !hasOceanContext;
}

export async function runDiscovery(
  brief: Brief,
  customQuery?: string,
  radiusMiles?: number
): Promise<{ results: DiscoveryResult[]; runId: number }> {
  const model = getGeminiModelWithSearch();
  const prompt = buildDiscoveryPrompt(brief, customQuery, radiusMiles);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let results: DiscoveryResult[] = [];
  try {
    // Strip markdown fences if present (```json ... ```)
    const cleaned = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      results = JSON.parse(jsonMatch[0]);
    }
  } catch {
    console.error('Failed to parse discovery results:', responseText);
    results = [];
  }

  // Qualitative hard filters (NOT budget — budget is sort only)
  results = results.filter(r => {
    if (isExcludedOrg(r.name)) {
      console.log(`Filtered out ${r.name}: excluded organization (enterprise oil & gas)`);
      return false;
    }
    if (isSingleSpecies(r.mission_focus, r.name)) {
      console.log(`Filtered out ${r.name}: single-species operation`);
      return false;
    }
    if (isFreshwater(r.mission_focus)) {
      console.log(`Filtered out ${r.name}: freshwater organization`);
      return false;
    }
    if (!r.name || !r.mission_focus) {
      console.log(`Filtered out result: missing name or mission_focus`);
      return false;
    }
    return true;
  });

  // Budget normalization and tier assignment (NOT a filter)
  results = results.map(r => {
    const budgetM = parseBudgetToMillions(r.estimated_budget);
    return {
      ...r,
      budget_tier: getBudgetTier(budgetM),
      leadership_signal_tier: r.leadership_signal_tier || 'unknown',
      leadership_signal_evidence: r.leadership_signal_evidence || 'Insufficient public data to assess leadership challenges. Recommend direct outreach to verify organizational context before pursuing.',
    };
  });

  // Sort by budget (high to low), with signal tier as tiebreaker
  const tierOrder: Record<string, number> = { confirmed: 0, inferred: 1, unknown: 2 };
  results.sort((a, b) => {
    const budgetDiff = parseBudgetToMillions(b.estimated_budget) - parseBudgetToMillions(a.estimated_budget);
    if (budgetDiff !== 0) return budgetDiff;
    return (tierOrder[a.leadership_signal_tier] ?? 2) - (tierOrder[b.leadership_signal_tier] ?? 2);
  });

  const run = createDiscoveryRun({
    brief_id: brief.id,
    query: customQuery || `Default search for ${brief.geography}`,
    prompt_used: prompt,
    raw_response: responseText,
    results_json: JSON.stringify(results),
    result_count: results.length,
  });

  return { results, runId: run.id };
}
