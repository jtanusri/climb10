'use client';

import DiscoveryPanel from '../discovery/discovery-panel';
import type { Brief, DiscoveryRun } from '@/lib/db/types';

interface BriefHubProps {
  initialBrief: Brief | null;
  pastRuns: DiscoveryRun[];
}

export default function BriefHub({ initialBrief, pastRuns }: BriefHubProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <DiscoveryPanel
        initialBrief={initialBrief}
        pastRuns={pastRuns}
      />
    </div>
  );
}
