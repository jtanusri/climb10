'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Mail, Copy, CheckCircle, Send, Save } from 'lucide-react';
import type { Organization, OutreachDraft } from '@/lib/db/types';

export default function OutreachStudio({ orgs }: { orgs: Organization[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedId = searchParams.get('orgId');

  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(
    preselectedId ? Number(preselectedId) : null
  );
  const [context, setContext] = useState({ mutualConnections: '', whyNow: '', additionalContext: '' });
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [existingDrafts, setExistingDrafts] = useState<OutreachDraft[]>([]);

  const selectedOrg = orgs.find(o => o.id === selectedOrgId);

  useEffect(() => {
    if (selectedOrgId) {
      fetch(`/api/organizations/${selectedOrgId}/outreach`)
        .then(r => r.json())
        .then(setExistingDrafts)
        .catch(() => {});
    }
  }, [selectedOrgId]);

  const generateDraft = async () => {
    if (!selectedOrgId) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(data.subject_line ? `Subject: ${data.subject_line}\n\n${data.body}` : data.body);
      setDraftId(data.id);
      setExistingDrafts(prev => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate draft');
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!draftId) return;
    await fetch(`/api/organizations/${selectedOrgId}/outreach/${draftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: draft }),
    });
  };

  const markSent = async () => {
    if (!draftId || !selectedOrgId) return;
    await fetch(`/api/organizations/${selectedOrgId}/outreach/${draftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    });
    await fetch(`/api/organizations/${selectedOrgId}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'outreach_sent' }),
    });
    router.refresh();
  };

  const copyDraft = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Context Builder */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-silver-200 p-5">
            <h2 className="font-semibold text-silver-900 mb-3">Select Organization</h2>
            <select
              value={selectedOrgId || ''}
              onChange={e => { setSelectedOrgId(Number(e.target.value) || null); setDraft(''); setDraftId(null); }}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm"
            >
              <option value="">Choose an organization...</option>
              {orgs.map(o => (
                <option key={o.id} value={o.id}>{o.name} ({o.stage.replace(/_/g, ' ')})</option>
              ))}
            </select>
          </div>

          {selectedOrg && (
            <>
              <div className="bg-plum-50 rounded-xl border border-plum-200 p-4">
                <h3 className="font-medium text-plum-800 text-sm mb-1">{selectedOrg.name}</h3>
                <p className="text-xs text-plum-600">{selectedOrg.mission_focus}</p>
                {selectedOrg.why_fit && (
                  <p className="text-xs text-plum-700 mt-2 italic">{selectedOrg.why_fit}</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-silver-200 p-5 space-y-4">
                <h2 className="font-semibold text-silver-900">Context for Outreach</h2>
                <div>
                  <label className="block text-sm font-medium text-silver-700 mb-1">Mutual Connections</label>
                  <input
                    value={context.mutualConnections}
                    onChange={e => setContext(c => ({...c, mutualConnections: e.target.value}))}
                    placeholder="Anyone in common to reference?"
                    className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-silver-700 mb-1">Why Now</label>
                  <textarea
                    value={context.whyNow}
                    onChange={e => setContext(c => ({...c, whyNow: e.target.value}))}
                    placeholder="Any specific reason the timing is right?"
                    rows={2}
                    className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-silver-700 mb-1">Additional Context</label>
                  <textarea
                    value={context.additionalContext}
                    onChange={e => setContext(c => ({...c, additionalContext: e.target.value}))}
                    placeholder="Anything else that should shape the tone or content?"
                    rows={2}
                    className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={generateDraft}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50 text-sm font-medium"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating Draft...</>
                  ) : (
                    <><Mail className="w-4 h-4" /> Generate Outreach Draft</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Draft Editor */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
          )}

          {draft ? (
            <div className="bg-white rounded-xl border border-silver-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-silver-900">Email Draft</h2>
                <div className="flex gap-2">
                  <button onClick={copyDraft} className="flex items-center gap-1 px-3 py-1.5 text-sm text-silver-600 hover:bg-silver-100 rounded-lg">
                    {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm font-mono"
              />
              <div className="flex gap-2">
                <button onClick={saveDraft}
                  className="flex items-center gap-2 px-4 py-2 bg-silver-100 text-silver-700 rounded-lg hover:bg-silver-200 text-sm">
                  <Save className="w-4 h-4" /> Save Draft
                </button>
                <button onClick={markSent}
                  className="flex items-center gap-2 px-4 py-2 bg-plum-800 text-white rounded-lg hover:bg-plum-700 text-sm">
                  <Send className="w-4 h-4" /> Mark as Sent
                </button>
              </div>
              <p className="text-xs text-silver-400">
                Copy the draft and send it from your own email client. Then click &quot;Mark as Sent&quot; to update the pipeline.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-silver-200 p-12 text-center">
              <Mail className="w-12 h-12 text-silver-300 mx-auto mb-3" />
              <p className="text-silver-500">
                {selectedOrg ? 'Add context and generate a draft' : 'Select an organization to get started'}
              </p>
            </div>
          )}

          {/* Existing Drafts */}
          {existingDrafts.length > 0 && (
            <div className="bg-white rounded-xl border border-silver-200 p-5">
              <h3 className="font-semibold text-silver-900 mb-3">Previous Drafts</h3>
              <div className="space-y-2">
                {existingDrafts.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setDraft(d.subject_line ? `Subject: ${d.subject_line}\n\n${d.body}` : d.body); setDraftId(d.id); }}
                    className="w-full text-left p-3 rounded-lg hover:bg-silver-50 border border-silver-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        d.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-silver-100 text-silver-600'
                      }`}>{d.status}</span>
                      <span className="text-xs text-silver-400">{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-silver-600 line-clamp-2">{d.body}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
