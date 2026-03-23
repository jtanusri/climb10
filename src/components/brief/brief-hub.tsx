'use client';

import { useState } from 'react';
import { FileText, Search, MapPin } from 'lucide-react';
import BriefForm from './brief-form';
import DiscoveryPanel from '../discovery/discovery-panel';
import DiscoveryMap from '../map/discovery-map';
import type { Brief, DiscoveryRun } from '@/lib/db/types';

interface MapOrg {
  id: number;
  name: string;
  location: string;
  estimated_budget: string;
  mission_focus: string;
  stage: string;
  keyword_category: string;
  signal_strength: string;
  leadership_signal_tier: string;
  lat: number;
  lng: number;
}

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
  hasBrief: boolean;
  pastRuns: DiscoveryRun[];
  pipelineLeads: PipelineLead[];
  mapOrgs: MapOrg[];
}

const tabs = [
  { key: 'brief', label: 'Brief', icon: FileText },
  { key: 'discovery', label: 'Discovery', icon: Search },
  { key: 'map', label: 'Map', icon: MapPin },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function BriefHub({ initialBrief, hasBrief, pastRuns, pipelineLeads, mapOrgs }: BriefHubProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('brief');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-silver-200 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-plum-700 text-plum-800'
                  : 'border-transparent text-silver-500 hover:text-silver-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'brief' && (
        <div>
          <div className="max-w-3xl mx-auto mb-6">
            <p className="text-silver-600 text-sm">
              Define your criteria for the ideal organization placement. This brief drives all AI-powered discovery and outreach.
            </p>
          </div>
          <BriefForm initialBrief={initialBrief} />
        </div>
      )}

      {activeTab === 'discovery' && (
        <DiscoveryPanel hasBrief={hasBrief} pastRuns={pastRuns} pipelineLeads={pipelineLeads} />
      )}

      {activeTab === 'map' && (
        <DiscoveryMap orgs={mapOrgs} />
      )}
    </div>
  );
}
