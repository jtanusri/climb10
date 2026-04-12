export type PipelineStage =
  | 'identified'
  | 'outreach_pending'
  | 'outreach_sent'
  | 'conversation_started'
  | 'meeting_scheduled'
  | 'residency_placed'
  | 'not_a_fit';

export const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'identified', label: 'Identified', color: 'bg-ocean-100 text-ocean-700' },
  { value: 'outreach_pending', label: 'Outreach Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'outreach_sent', label: 'Outreach Sent', color: 'bg-ocean-200 text-ocean-800' },
  { value: 'conversation_started', label: 'Conversation Started', color: 'bg-lime-100 text-lime-700' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-plum-100 text-plum-700' },
  { value: 'residency_placed', label: 'Residency Placed', color: 'bg-lime-200 text-lime-800' },
  { value: 'not_a_fit', label: 'Not a Fit', color: 'bg-silver-200 text-silver-600' },
];

// Leadership signal tier system
export type LeadershipSignalTier = 'confirmed' | 'inferred' | 'unknown';

export const SIGNAL_TIER_DISPLAY: Record<LeadershipSignalTier, { label: string; color: string; badge: string }> = {
  confirmed: { label: 'Confirmed Signal', color: 'bg-teal-100 text-teal-800', badge: 'bg-teal-500' },
  inferred: { label: 'Possible Signal', color: 'bg-amber-100 text-amber-800', badge: 'bg-amber-500' },
  unknown: { label: 'Verify Directly', color: 'bg-gray-100 text-gray-600', badge: 'bg-gray-400' },
};

// Budget tier system
export type BudgetTier = 'enterprise' | 'large' | 'mid' | 'small_mid' | 'small';

export const BUDGET_TIERS: { value: BudgetTier; label: string; min: number; color: string }[] = [
  { value: 'enterprise', label: 'Enterprise ($200M+)', min: 200, color: 'bg-plum-100 text-plum-800' },
  { value: 'large', label: 'Large ($80M–$200M)', min: 80, color: 'bg-ocean-100 text-ocean-800' },
  { value: 'mid', label: 'Mid ($20M–$80M)', min: 20, color: 'bg-lime-100 text-lime-800' },
  { value: 'small_mid', label: 'Small-Mid ($10M–$20M)', min: 10, color: 'bg-amber-100 text-amber-800' },
  { value: 'small', label: 'Small (under $10M)', min: 0, color: 'bg-silver-100 text-silver-700' },
];

export function getBudgetTier(budgetMillions: number): BudgetTier {
  if (budgetMillions >= 200) return 'enterprise';
  if (budgetMillions >= 80) return 'large';
  if (budgetMillions >= 20) return 'mid';
  if (budgetMillions >= 10) return 'small_mid';
  return 'small';
}

export function getBudgetTierDisplay(tier: BudgetTier) {
  return BUDGET_TIERS.find(t => t.value === tier) ?? BUDGET_TIERS[4];
}

// Keyword categories for map visualization
export type KeywordCategory = 'sector' | 'infra' | 'econ' | 'sci' | 'gov' | 'cons' | 'food' | 'donor' | 'investor';

export const KEYWORD_CATEGORIES: { value: KeywordCategory; label: string; color: string }[] = [
  { value: 'sector', label: 'Sector Synonyms', color: '#1D9E75' },
  { value: 'infra', label: 'Infrastructure / Operational', color: '#185FA5' },
  { value: 'econ', label: 'Economic Framing', color: '#BA7517' },
  { value: 'sci', label: 'Scientific / Technical', color: '#534AB7' },
  { value: 'gov', label: 'Governance / Policy', color: '#993C1D' },
  { value: 'cons', label: 'Conservation / Sustainability', color: '#0E7C5A' },
  { value: 'food', label: 'Food Systems', color: '#D06B18' },
  { value: 'donor', label: 'Donors / Philanthropy', color: '#8B2FC9' },
  { value: 'investor', label: 'Investors / Accelerators', color: '#C4960A' },
];

export type OrgSource = 'ai_discovery' | 'spreadsheet_import' | 'manual';

// Signal strength for map marker sizing
export type SignalStrength = 'high' | 'strong' | 'supplemental' | 'careful';

export const SIGNAL_STRENGTHS: { value: SignalStrength; label: string; radius: number; opacity: number }[] = [
  { value: 'high', label: 'High — Leslie\'s sweet spot', radius: 7.5, opacity: 1.0 },
  { value: 'strong', label: 'Strong — broad sector capture', radius: 5.5, opacity: 0.9 },
  { value: 'supplemental', label: 'Supplemental — widens net', radius: 4.0, opacity: 0.65 },
  { value: 'careful', label: 'Use carefully — needs qualifier', radius: 3.5, opacity: 0.45 },
];

// Review status for lead contacts
export type ReviewStatus = 'Lead for Business' | 'Lead for Review' | 'Pending Review' | 'Do NOT Contact';

export interface Brief {
  id: number;
  geography: string;
  radius_miles: number;
  budget_display_note: string | null;
  headcount_display_note: string | null;
  budget_preferred_min: number | null;
  headcount_preferred_min: number | null;
  placement_start: string;
  placement_duration_weeks: string;
  focus_areas: string;
  leadership_problems: string;
  non_negotiables: string;
  advisor_bio_summary: string;
  win_win_win_criteria: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  location: string;
  website: string;
  estimated_size: string;
  estimated_budget: string;
  mission_focus: string;
  why_fit: string;
  stage: PipelineStage;
  keyword_category: KeywordCategory | '';
  signal_strength: SignalStrength | '';
  leadership_signal_tier: LeadershipSignalTier;
  leadership_signal_evidence: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number | null;
  lng: number | null;
  discovery_run_id: number | null;
  source: OrgSource;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  organization_id: number;
  contact_name: string;
  contact_email: string;
  contact_position: string;
  contact_linkedin: string;
  contact_bio: string;
  review_status: ReviewStatus;
  host_producer_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  organization_id: number;
  type: 'qualification' | 'briefing' | 'call_note' | 'general';
  content: string;
  created_at: string;
}

export interface OutreachDraft {
  id: number;
  organization_id: number;
  contact_id: number | null;
  subject_line: string;
  body: string;
  status: 'draft' | 'sent';
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryRun {
  id: number;
  brief_id: number | null;
  query: string;
  prompt_used: string;
  raw_response: string;
  results_json: string;
  result_count: number;
  orgs_added_to_pipeline: number;
  status: 'pending' | 'complete' | 'failed';
  error: string;
  created_at: string;
}

export interface StageTransition {
  id: number;
  organization_id: number;
  from_stage: string | null;
  to_stage: string;
  note: string;
  transitioned_at: string;
}

export interface FollowUpReminder {
  id: number;
  organization_id: number;
  due_date: string;
  note: string;
  is_complete: number;
  completed_at: string | null;
  created_at: string;
  org_name?: string;
}
