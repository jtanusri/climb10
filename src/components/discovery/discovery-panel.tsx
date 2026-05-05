'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, AlertCircle, ChevronDown, ChevronUp, MapPin, Filter, CheckCircle } from 'lucide-react';
import OrgDiscoveryCard from './org-discovery-card';
import type { Brief, DiscoveryRun, LeadershipSignalTier } from '@/lib/db/types';
import { SIGNAL_TIER_DISPLAY } from '@/lib/db/types';

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
  org_type?: string;
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

interface Props {
  initialBrief: Brief | null;
  pastRuns: DiscoveryRun[];
}

export default function DiscoveryPanel({ initialBrief, pastRuns }: Props) {
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
      // Phase 1: Start discovery — returns immediately with runId
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

      const runId = data.runId;
      if (!runId) throw new Error('No run ID returned');

      // Phase 2: Poll for results every 3 seconds
      const maxAttempts = 40; // 40 × 3s = 2 minutes max
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const pollRes = await fetch(`/api/discover/${runId}`);
        const pollData = await pollRes.json();

        if (pollData.status === 'complete') {
          setResults(pollData.results || []);
          return;
        }
        if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Discovery failed');
        }
        // status === 'pending' — keep polling
      }
      throw new Error('Discovery timed out. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = tierFilter === 'all'
    ? results
    : results.filter(r => r.leadership_signal_tier === tierFilter);

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

      {/* Signal Tier Filter for AI results */}
      {results.length > 0 && (
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
