'use client';

import { useState } from 'react';
import { Loader2, BookOpen, Copy, CheckCircle } from 'lucide-react';
import type { Organization } from '@/lib/db/types';

export default function BriefingGenerator({ orgs }: { orgs: Organization[] }) {
  const meetingOrgs = orgs.filter(o =>
    o.stage === 'meeting_scheduled' || o.stage === 'conversation_started'
  );
  const allOrgs = orgs.filter(o => o.stage !== 'not_a_fit');

  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [briefing, setBriefing] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateBriefing = async () => {
    if (!selectedOrgId) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBriefing(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate briefing');
    } finally {
      setGenerating(false);
    }
  };

  const copyBriefing = () => {
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <p className="text-sm text-silver-600">
        Generate AI-powered briefing notes before meetings. The AI searches for the latest information about the organization.
      </p>

      <div className="bg-white rounded-xl border border-silver-200 p-5">
        <h2 className="font-semibold text-silver-900 mb-3">Select Organization</h2>

        {meetingOrgs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-silver-500 uppercase mb-2">Meetings Scheduled</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {meetingOrgs.map(o => (
                <button
                  key={o.id}
                  onClick={() => { setSelectedOrgId(o.id); setBriefing(''); }}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedOrgId === o.id
                      ? 'border-plum-500 bg-plum-50'
                      : 'border-silver-200 hover:border-plum-300'
                  }`}
                >
                  <p className="font-medium text-sm text-silver-900">{o.name}</p>
                  <p className="text-xs text-silver-500">{o.location}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-silver-500 uppercase mb-2">All Pipeline Organizations</p>
          <select
            value={selectedOrgId || ''}
            onChange={e => { setSelectedOrgId(Number(e.target.value) || null); setBriefing(''); }}
            className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm"
          >
            <option value="">Choose...</option>
            {allOrgs.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {selectedOrgId && (
          <button
            onClick={generateBriefing}
            disabled={generating}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-plum-800 text-white rounded-lg hover:bg-plum-700 disabled:opacity-50 text-sm font-medium"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating Briefing...</>
            ) : (
              <><BookOpen className="w-4 h-4" /> Generate Briefing Notes</>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {generating && (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-plum-500 mx-auto mb-4" />
          <p className="text-silver-600">Researching organization and preparing briefing...</p>
          <p className="text-sm text-silver-400 mt-1">This may take 15-30 seconds</p>
        </div>
      )}

      {briefing && (
        <div className="bg-white rounded-xl border border-silver-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-silver-900">Pre-Meeting Briefing</h2>
            <button onClick={copyBriefing}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-silver-600 hover:bg-silver-100 rounded-lg">
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-silver-700">
            {briefing.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-silver-900 mt-6 mb-2">{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-md font-semibold text-silver-800 mt-4 mb-1">{line.replace('### ', '')}</h3>;
              if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="mb-1">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
