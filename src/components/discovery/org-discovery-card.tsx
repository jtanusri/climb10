'use client';

import { useState } from 'react';
import { MapPin, Users, DollarSign, Plus, CheckCircle, ExternalLink, User, Mail, Linkedin, FileText, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SIGNAL_TIER_DISPLAY, BUDGET_TIERS, getBudgetTier } from '@/lib/db/types';
import { parseBudgetToMillions } from '@/lib/utils/budget';
import type { LeadershipSignalTier, ReviewStatus, KeywordCategory, SignalStrength, BudgetTier } from '@/lib/db/types';

interface DiscoveryResult {
  name: string;
  location: string;
  website: string;
  estimated_size: number | string;
  estimated_budget: string;
  budget_tier?: BudgetTier;
  mission_focus: string;
  why_fit: string;
  keyword_category?: string;
  signal_strength?: string;
  leadership_signal_tier: LeadershipSignalTier;
  leadership_signal_evidence: string;
  lat?: number;
  lng?: number;
  contact_name: string;
  contact_email: string;
  contact_position: string;
  contact_linkedin?: string;
  contact_bio?: string;
  review_status: string;
  host_producer_notes?: string;
}

const reviewStatusStyles: Record<string, string> = {
  'Lead for Business': 'bg-green-50 text-green-700 border-green-200',
  'Lead for Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Do NOT Contact': 'bg-red-50 text-red-700 border-red-200',
};

export default function OrgDiscoveryCard({ org }: { org: DiscoveryResult }) {
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [duplicateMsg, setDuplicateMsg] = useState('');
  const router = useRouter();

  const budgetM = parseBudgetToMillions(org.estimated_budget);
  const budgetTier = getBudgetTier(budgetM);
  const budgetTierDisplay = BUDGET_TIERS.find(t => t.value === budgetTier);
  const signalDisplay = SIGNAL_TIER_DISPLAY[org.leadership_signal_tier || 'unknown'];

  const addToPipeline = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: org.name,
          location: org.location,
          website: org.website,
          estimated_size: String(org.estimated_size),
          estimated_budget: org.estimated_budget,
          mission_focus: org.mission_focus,
          why_fit: org.why_fit,
          stage: 'identified',
          keyword_category: org.keyword_category || '',
          signal_strength: org.signal_strength || '',
          leadership_signal_tier: org.leadership_signal_tier || 'unknown',
          leadership_signal_evidence: org.leadership_signal_evidence || '',
          lat: org.lat || null,
          lng: org.lng || null,
          contact_name: org.contact_name,
          contact_email: org.contact_email,
          contact_position: org.contact_position,
          contact_linkedin: org.contact_linkedin,
          contact_bio: org.contact_bio,
          review_status: org.review_status,
          host_producer_notes: org.host_producer_notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDuplicateMsg(data.error || 'Failed to add');
        return;
      }
      setAdded(true);
      router.refresh();
    } catch (err) {
      console.error('Failed to add org:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-silver-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-silver-900 text-lg">{org.name}</h3>
        {org.website && (
          <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-ocean-500 hover:text-ocean-700 flex-shrink-0">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Badges row: budget tier + signal tier */}
      <div className="flex flex-wrap gap-2 mb-3">
        {budgetTierDisplay && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${budgetTierDisplay.color}`}>
            {budgetTierDisplay.label}
          </span>
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${signalDisplay.color}`}>
          <Shield className="w-3 h-3" />
          {signalDisplay.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mb-3 text-sm text-silver-600">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {org.location}
        </span>
        {org.estimated_size && (
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> ~{org.estimated_size} people
          </span>
        )}
        {org.estimated_budget && (
          <span className="flex items-center gap-1 font-medium text-silver-800">
            <DollarSign className="w-3.5 h-3.5" /> {org.estimated_budget}
          </span>
        )}
      </div>

      <p className="text-sm text-silver-700 mb-3">{org.mission_focus}</p>

      <div className="bg-plum-50 rounded-lg p-3 mb-3">
        <p className="text-xs font-medium text-plum-800 mb-1">Why This is a Fit</p>
        <p className="text-sm text-plum-700">{org.why_fit}</p>
      </div>

      {/* Leadership Signal Evidence */}
      {org.leadership_signal_evidence && (
        <div className="bg-silver-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-silver-600 mb-1">Leadership Signal Evidence</p>
          <p className="text-sm text-silver-700">{org.leadership_signal_evidence}</p>
        </div>
      )}

      {/* Lead Contact Section */}
      {org.contact_name && (
        <div className="border border-silver-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-silver-500 uppercase tracking-wide">Lead Contact</p>
            {org.review_status && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${reviewStatusStyles[org.review_status] || 'bg-silver-50 text-silver-600 border-silver-200'}`}>
                {org.review_status}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-silver-400" />
              <span className="text-sm font-medium text-silver-900">{org.contact_name}</span>
              {org.contact_position && (
                <span className="text-xs text-silver-500">· {org.contact_position}</span>
              )}
            </div>
            {org.contact_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-silver-400" />
                <a href={`mailto:${org.contact_email}`} className="text-sm text-ocean-600 hover:underline">{org.contact_email}</a>
              </div>
            )}
            {org.contact_linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="w-3.5 h-3.5 text-silver-400" />
                <a href={org.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-ocean-600 hover:underline">LinkedIn Profile</a>
              </div>
            )}
            {org.contact_bio && (
              <p className="text-xs text-silver-600 mt-1">{org.contact_bio}</p>
            )}
          </div>
          {org.host_producer_notes && (
            <div className="mt-2 pt-2 border-t border-silver-100">
              <div className="flex items-start gap-1.5">
                <FileText className="w-3 h-3 text-silver-400 mt-0.5" />
                <p className="text-xs text-silver-600 italic">{org.host_producer_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {duplicateMsg ? (
        <div className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
          {duplicateMsg}
        </div>
      ) : (
        <button
          onClick={addToPipeline}
          disabled={added || adding}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            added
              ? 'bg-lime-50 text-lime-700 border border-lime-200'
              : 'bg-plum-800 text-white hover:bg-plum-700'
          }`}
        >
          {added ? (
            <><CheckCircle className="w-4 h-4" /> Added to Pipeline</>
          ) : adding ? (
            'Adding...'
          ) : (
            <><Plus className="w-4 h-4" /> Add to Pipeline</>
          )}
        </button>
      )}
    </div>
  );
}
