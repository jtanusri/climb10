'use client';

import Link from 'next/link';
import { MapPin, DollarSign, Shield } from 'lucide-react';
import type { Organization } from '@/lib/db/types';
import { SIGNAL_TIER_DISPLAY, KEYWORD_CATEGORIES, BUDGET_TIERS, getBudgetTier } from '@/lib/db/types';
import { parseBudgetToMillions } from '@/lib/utils/budget';

export default function PipelineCard({ org }: { org: Organization }) {
  const budgetM = parseBudgetToMillions(org.estimated_budget);
  const budgetTier = getBudgetTier(budgetM);
  const budgetTierDisplay = BUDGET_TIERS.find(t => t.value === budgetTier);
  const signalDisplay = SIGNAL_TIER_DISPLAY[org.leadership_signal_tier || 'unknown'];
  const categoryDisplay = KEYWORD_CATEGORIES.find(c => c.value === org.keyword_category);

  return (
    <Link href={`/pipeline/${org.id}`}>
      <div className="bg-white rounded-lg border border-silver-200 p-3 hover:shadow-md hover:border-plum-300 transition-all cursor-pointer">
        <h4 className="font-medium text-silver-900 text-sm mb-1 truncate">{org.name}</h4>
        {(org.city || org.state || org.country || org.location) && (
          <p className="flex items-center gap-1 text-xs text-silver-500 mb-2">
            <MapPin className="w-3 h-3" />
            {[org.address, org.city, org.state, org.zip, org.country].filter(Boolean).join(', ') || org.location}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {categoryDisplay && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: categoryDisplay.color }}
            >
              {categoryDisplay.label.split(' / ')[0]}
            </span>
          )}
          {org.estimated_budget && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${budgetTierDisplay?.color || 'bg-silver-100 text-silver-600'}`}>
              <DollarSign className="w-2.5 h-2.5" />
              {org.estimated_budget}
            </span>
          )}
          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${signalDisplay.color}`}>
            <Shield className="w-2.5 h-2.5" />
            {org.leadership_signal_tier === 'confirmed' ? 'Confirmed' : org.leadership_signal_tier === 'inferred' ? 'Inferred' : 'Verify'}
          </span>
        </div>
      </div>
    </Link>
  );
}
