'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, ChevronDown, ChevronUp, MapPin, Filter, User, Mail, Linkedin, ExternalLink, Shield, DollarSign, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import OrgDiscoveryCard from './org-discovery-card';
import type { Brief, DiscoveryRun, LeadershipSignalTier } from '@/lib/db/types';
import { SIGNAL_TIER_DISPLAY, BUDGET_TIERS, getBudgetTier } from '@/lib/db/types';
import { parseBudgetToMillions } from '@/lib/utils/budget';
import type { PipelineLead } from '../brief/brief-hub';

// Inline discovery result type to avoid importing server-side code
interface DiscoveryResult {
  name: string;
  location: string;
  website: string;
  estimated_size: number | string;
  estimated_budget: string;
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
  review_status: 'Lead for Review' | 'Lead for Business' | 'Do NOT Contact' | 'Pending Review';
  host_producer_notes?: string;
  [key: string]: unknown;
}

const reviewStatusStyles: Record<string, string> = {
  'Lead for Business': 'bg-green-50 text-green-700 border-green-200',
  'Lead for Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Do NOT Contact': 'bg-red-50 text-red-700 border-red-200',
};

const stageLabels: Record<string, string> = {
  identified: 'Identified',
  outreach_pending: 'Outreach Pending',
  outreach_sent: 'Outreach Sent',
  conversation_started: 'Conversation Started',
  meeting_scheduled: 'Meeting Scheduled',
  residency_placed: 'Residency Placed',
  not_a_fit: 'Not a Fit',
};

interface Props {
  initialBrief: Brief | null;
  pastRuns: DiscoveryRun[];
  pipelineLeads?: PipelineLead[];
}

export default function DiscoveryPanel({ initialBrief, pastRuns, pipelineLeads = [] }: Props) {
  const [geography, setGeography] = useState(initialBrief?.geography || 'Halifax, Nova Scotia');
  const [radiusMiles, setRadiusMiles] = useState(initialBrief?.radius_miles || 15);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [tierFilter, setTierFilter] = useState<LeadershipSignalTier | 'all'>('all');
  const [briefSaved, setBriefSaved] = useState(false);

  const isInitialMount = useRef(true);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  // Auto-save brief when geography or radius changes (debounced)
  const saveBrief = useCallback(async (geo: string, radius: number) => {
    try {
      await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geography: geo, radius_miles: radius }),
      });
      setBriefSaved(true);
      setTimeout(() => setBriefSaved(false), 2000);
    } catch {
      // Silent fail — brief will be force-saved before discovery
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveBrief(geography, radiusMiles), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [geography, radiusMiles, saveBrief]);

  const runDiscovery = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    // Force-save brief immediately before discovery (bypass debounce)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geography, radius_miles: radiusMiles }),
      });
    } catch {
      // Continue with discovery even if brief save fails
    }

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query ? `${query} within ${radiusMiles} miles` : undefined,
          radiusMiles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = tierFilter === 'all'
    ? results
    : results.filter(r => r.leadership_signal_tier === tierFilter);

  const filteredLeads = tierFilter === 'all'
    ? pipelineLeads
    : pipelineLeads.filter(l => l.leadership_signal_tier === tierFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search Controls — unified top bar */}
      <div className="bg-white rounded-xl border border-silver-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-silver-900">Organization Discovery</h2>
          {briefSaved && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        {/* Geography + Radius row */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-ocean-50 rounded-lg border border-ocean-100">
          <MapPin className="w-4 h-4 text-ocean-600 flex-shrink-0" />
          <input
            type="text"
            value={geography}
            onChange={e => setGeography(e.target.value)}
            placeholder="Halifax, Nova Scotia"
            className="flex-1 px-3 py-1.5 border border-ocean-200 rounded text-sm bg-white focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
          />
          <span className="text-sm text-silver-600">within</span>
          <input
            type="number"
            min={5}
            max={100}
            value={radiusMiles}
            onChange={e => setRadiusMiles(Number(e.target.value))}
            className="w-16 px-2 py-1.5 border border-ocean-200 rounded text-sm text-center bg-white"
          />
          <span className="text-sm text-silver-600">mi</span>
          <div className="flex gap-1">
            {[15, 25, 50].map(r => (
              <button
                key={r}
                onClick={() => setRadiusMiles(r)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  radiusMiles === r
                    ? 'bg-ocean-500 text-white'
                    : 'bg-white text-ocean-600 border border-ocean-200 hover:bg-ocean-100'
                }`}
              >
                {r} mi
              </button>
            ))}
          </div>
        </div>

        {/* Query + Run button row */}
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && runDiscovery()}
            placeholder='e.g. "ocean technology" or "blue economy"'
            className="flex-1 px-4 py-2.5 border border-silver-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-sm"
          />
          <button
            onClick={runDiscovery}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
            ) : (
              <><Search className="w-4 h-4" /> Run Discovery</>
            )}
          </button>
        </div>
      </div>

      {/* Signal Tier Filter (shared between AI results and pipeline leads) */}
      {(pipelineLeads.length > 0 || results.length > 0) && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-silver-400" />
          <span className="text-sm text-silver-600">Filter by signal:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setTierFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                tierFilter === 'all' ? 'bg-silver-800 text-white' : 'bg-silver-100 text-silver-600 hover:bg-silver-200'
              }`}
            >
              All
            </button>
            {(['confirmed', 'inferred', 'unknown'] as LeadershipSignalTier[]).map(tier => {
              const display = SIGNAL_TIER_DISPLAY[tier];
              return (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    tierFilter === tier ? display.color + ' font-medium' : 'bg-silver-100 text-silver-600 hover:bg-silver-200'
                  }`}
                >
                  {display.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Discovery Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-ocean-500 mx-auto mb-4" />
          <p className="text-silver-600">Searching ocean organizations near {geography}...</p>
          <p className="text-sm text-silver-400 mt-1">This may take 20-40 seconds</p>
        </div>
      )}

      {/* AI Discovery Results */}
      {results.length > 0 && (
        <div>
          <h3 className="font-semibold text-silver-900 mb-4">
            AI Discovery Results — {filteredResults.length} organization{filteredResults.length !== 1 ? 's' : ''}
            {tierFilter !== 'all' && ` (filtered from ${results.length})`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResults.map((org, i) => (
              <OrgDiscoveryCard key={i} org={org} />
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Leads for Review */}
      {filteredLeads.length > 0 && (
        <div>
          <h3 className="font-semibold text-silver-900 mb-4">
            Leads for Review — {filteredLeads.length} organization{filteredLeads.length !== 1 ? 's' : ''} in pipeline
          </h3>
          <div className="space-y-3">
            {filteredLeads.map(lead => {
              const budgetM = parseBudgetToMillions(lead.estimated_budget);
              const budgetTier = getBudgetTier(budgetM);
              const budgetTierDisplay = BUDGET_TIERS.find(t => t.value === budgetTier);
              const signalDisplay = SIGNAL_TIER_DISPLAY[lead.leadership_signal_tier as LeadershipSignalTier] || SIGNAL_TIER_DISPLAY.unknown;

              return (
                <div key={lead.id} className="bg-white rounded-xl border border-silver-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link href={`/pipeline/${lead.id}`} className="font-semibold text-silver-900 text-lg hover:text-plum-700">
                        {lead.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-silver-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {lead.location}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-ocean-500 hover:text-ocean-700">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-silver-100 text-silver-600 font-medium">
                      {stageLabels[lead.stage] || lead.stage}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {lead.estimated_budget && (
                      <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full font-medium ${budgetTierDisplay?.color || 'bg-silver-100 text-silver-600'}`}>
                        <DollarSign className="w-3 h-3" />
                        {lead.estimated_budget}
                      </span>
                    )}
                    {lead.estimated_size && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-silver-100 text-silver-600">
                        ~{lead.estimated_size} people
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full font-medium ${signalDisplay.color}`}>
                      <Shield className="w-3 h-3" />
                      {signalDisplay.label}
                    </span>
                  </div>

                  {/* Mission & Fit */}
                  <p className="text-sm text-silver-700 mb-2">{lead.mission_focus}</p>
                  {lead.why_fit && (
                    <div className="bg-plum-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-plum-800 mb-1">Why This is a Fit</p>
                      <p className="text-sm text-plum-700">{lead.why_fit}</p>
                    </div>
                  )}

                  {/* Lead Contact Details */}
                  {lead.contact_name && (
                    <div className="border border-silver-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-silver-500 uppercase tracking-wide">Lead Contact</p>
                        {lead.review_status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${reviewStatusStyles[lead.review_status] || 'bg-silver-50 text-silver-600 border-silver-200'}`}>
                            {lead.review_status}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-silver-400" />
                          <span className="text-sm font-medium text-silver-900">{lead.contact_name}</span>
                          {lead.contact_position && (
                            <span className="text-xs text-silver-500">· {lead.contact_position}</span>
                          )}
                        </div>
                        {lead.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-silver-400" />
                            <a href={`mailto:${lead.contact_email}`} className="text-sm text-ocean-600 hover:underline">{lead.contact_email}</a>
                          </div>
                        )}
                        {lead.contact_linkedin && (
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4 text-silver-400" />
                            <a href={lead.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-ocean-600 hover:underline">
                              {lead.contact_linkedin.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')}
                            </a>
                          </div>
                        )}
                        {lead.contact_bio && (
                          <p className="text-xs text-silver-600 mt-1">{lead.contact_bio}</p>
                        )}
                      </div>
                      {lead.host_producer_notes && (
                        <div className="mt-2 pt-2 border-t border-silver-100">
                          <div className="flex items-start gap-1.5">
                            <FileText className="w-3 h-3 text-silver-400 mt-0.5" />
                            <p className="text-xs text-silver-600 italic">{lead.host_producer_notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Runs */}
      {pastRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-silver-200 p-5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 w-full text-left"
          >
            <h3 className="font-semibold text-silver-900">Discovery History</h3>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-sm text-silver-500 ml-auto">{pastRuns.length} run{pastRuns.length !== 1 ? 's' : ''}</span>
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {pastRuns.map(run => (
                <div key={run.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-silver-50">
                  <span className="text-silver-500">{new Date(run.created_at).toLocaleDateString()}</span>
                  <span className="text-silver-700 flex-1">{run.query}</span>
                  <span className="text-silver-500">{run.result_count} results</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
