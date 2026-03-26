'use client';

import DiscoveryPanel from '../discovery/discovery-panel';
import type { Brief, DiscoveryRun } from '@/lib/db/types';

export interface PipelineLead {
  id: number;
  name: string;
  location: string;
  website: string;
  estimated_size: string;
  estimated_budget: string;
  mission_focus: string;
  why_fit: string;
  stage: string;
  keyword_category: string;
  signal_strength: string;
  leadership_signal_tier: string;
  leadership_signal_evidence: string;
  contact_name: string;
  contact_email: string;
  contact_position: string;
  contact_linkedin: string;
  contact_bio: string;
  review_status: string;
  host_producer_notes: string;
}

interface BriefHubProps {
  initialBrief: Brief | null;
  pastRuns: DiscoveryRun[];
  pipelineLeads: PipelineLead[];
}

export default function BriefHub({ initialBrief, pastRuns, pipelineLeads }: BriefHubProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <DiscoveryPanel
        initialBrief={initialBrief}
        pastRuns={pastRuns}
        pipelineLeads={pipelineLeads}
      />
    </div>
  );
}
