'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, Save, Trash2, Plus, X,
  User, FileText, Mail, Clock, Loader2, Shield, DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { PIPELINE_STAGES, SIGNAL_TIER_DISPLAY, BUDGET_TIERS, ORG_TYPES, getBudgetTier,
  type Organization, type Contact, type Note, type OutreachDraft, type PipelineStage, type LeadershipSignalTier, type OrgType } from '@/lib/db/types';
import { parseBudgetToMillions } from '@/lib/utils/budget';

const reviewStatusStyles: Record<string, string> = {
  'Lead for Business': 'bg-green-50 text-green-700 border-green-200',
  'Lead for Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Do NOT Contact': 'bg-red-50 text-red-700 border-red-200',
};

interface Props {
  org: Organization;
  contacts: Contact[];
  notes: Note[];
  drafts: OutreachDraft[];
}

export default function OrgDetail({ org: initialOrg, contacts: initialContacts, notes: initialNotes, drafts }: Props) {
  const router = useRouter();
  const [org, setOrg] = useState(initialOrg);
  const [contacts, setContacts] = useState(initialContacts);
  const [notes, setNotes] = useState(initialNotes);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'notes' | 'outreach'>('overview');
  const [saving, setSaving] = useState(false);

  const budgetM = parseBudgetToMillions(org.estimated_budget);
  const budgetTier = getBudgetTier(budgetM);
  const budgetTierDisplay = BUDGET_TIERS.find(t => t.value === budgetTier);
  const signalDisplay = SIGNAL_TIER_DISPLAY[org.leadership_signal_tier || 'unknown'];

  const [form, setForm] = useState({
    name: org.name,
    location: org.location,
    website: org.website,
    estimated_size: org.estimated_size,
    estimated_budget: org.estimated_budget,
    mission_focus: org.mission_focus,
    leadership_signal_tier: org.leadership_signal_tier,
    leadership_signal_evidence: org.leadership_signal_evidence,
    address: org.address || '',
    city: org.city || '',
    state: org.state || '',
    zip: org.zip || '',
    country: org.country || '',
    org_type: (org.org_type || 'unknown') as OrgType,
  });

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ contact_name: '', contact_position: '', contact_email: '', contact_linkedin: '', contact_bio: '', review_status: 'Pending Review', host_producer_notes: '' });
  const [noteForm, setNoteForm] = useState({ type: 'general', content: '' });

  const saveOrg = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setOrg(updated);
    } finally {
      setSaving(false);
    }
  };

  const changeStage = async (stage: PipelineStage) => {
    await fetch(`/api/organizations/${org.id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    setOrg(prev => ({ ...prev, stage }));
    router.refresh();
  };

  const deleteOrg = async () => {
    if (!confirm('Delete this organization from the pipeline?')) return;
    await fetch(`/api/organizations/${org.id}`, { method: 'DELETE' });
    router.push('/pipeline');
  };

  const addContact = async () => {
    if (!contactForm.contact_name.trim()) return;
    const res = await fetch(`/api/organizations/${org.id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactForm),
    });
    const contact = await res.json();
    setContacts(prev => [contact, ...prev]);
    setContactForm({ contact_name: '', contact_position: '', contact_email: '', contact_linkedin: '', contact_bio: '', review_status: 'Pending Review', host_producer_notes: '' });
    setShowContactForm(false);
  };

  const deleteContact = async (id: number) => {
    await fetch(`/api/organizations/${org.id}/contacts/${id}`, { method: 'DELETE' });
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const addNote = async () => {
    if (!noteForm.content.trim()) return;
    const res = await fetch(`/api/organizations/${org.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteForm),
    });
    const note = await res.json();
    setNotes(prev => [note, ...prev]);
    setNoteForm({ type: 'general', content: '' });
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/organizations/${org.id}/notes/${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'contacts', label: `Contacts (${contacts.length})`, icon: User },
    { key: 'notes', label: `Notes (${notes.length})`, icon: FileText },
    { key: 'outreach', label: `Outreach (${drafts.length})`, icon: Mail },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/pipeline" className="p-2 rounded-lg hover:bg-silver-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-silver-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-silver-900">{org.name}</h1>
          {(org.city || org.state || org.country || org.location) && (
            <p className="text-sm text-silver-500">
              {[org.address, org.city, org.state, org.zip, org.country].filter(Boolean).join(', ') || org.location}
            </p>
          )}
        </div>
        <select
          value={org.stage}
          onChange={e => changeStage(e.target.value as PipelineStage)}
          className="px-3 py-2 border border-silver-300 rounded-lg text-sm"
        >
          {PIPELINE_STAGES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {org.org_type && org.org_type !== 'unknown' && (() => {
          const t = ORG_TYPES.find(x => x.value === org.org_type);
          if (!t) return null;
          return (
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${t.color}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t.icon && <img src={t.icon} alt="" className="w-3.5 h-3.5" />}
              {t.label}
            </span>
          );
        })()}
        {org.estimated_budget && (
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${budgetTierDisplay?.color || 'bg-silver-100 text-silver-600'}`}>
            <DollarSign className="w-3 h-3" /> {org.estimated_budget}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${signalDisplay.color}`}>
          <Shield className="w-3 h-3" /> {signalDisplay.label}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => changeStage('conversation_started')}
          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors">
          Reply Received
        </button>
        <button onClick={() => changeStage('meeting_scheduled')}
          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors">
          Meeting Booked
        </button>
        <Link href={`/outreach?orgId=${org.id}`}
          className="px-3 py-1.5 bg-ocean-50 text-ocean-700 rounded-lg text-sm hover:bg-ocean-100 transition-colors">
          Draft Outreach
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-silver-200 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-plum-700 text-plum-800' : 'border-transparent text-silver-500 hover:text-silver-700'
              }`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {org.why_fit && (
            <div className="bg-plum-50 rounded-xl p-5 border border-plum-200">
              <h3 className="font-medium text-plum-800 mb-2">Why This is a Fit</h3>
              <p className="text-sm text-plum-700">{org.why_fit}</p>
            </div>
          )}

          {org.leadership_signal_evidence && (
            <div className="bg-silver-50 rounded-xl p-5 border border-silver-200">
              <h3 className="font-medium text-silver-800 mb-2">Leadership Signal Evidence</h3>
              <p className="text-sm text-silver-700">{org.leadership_signal_evidence}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-silver-200 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">City</label>
                <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">State</label>
                <input value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Zip</label>
                <input value={form.zip} onChange={e => setForm(f => ({...f, zip: e.target.value}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Country</label>
                <input value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-1">Website</label>
              <div className="flex gap-2">
                <input value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))}
                  className="flex-1 px-3 py-2 border border-silver-300 rounded-lg text-sm" />
                {form.website && (
                  <a href={form.website} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-ocean-600 hover:bg-ocean-50 rounded-lg">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Estimated Size</label>
                <input value={form.estimated_size}
                  onChange={e => setForm(f => ({...f, estimated_size: e.target.value}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Estimated Budget</label>
                <input value={form.estimated_budget} onChange={e => setForm(f => ({...f, estimated_budget: e.target.value}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-1">Mission Focus</label>
              <textarea value={form.mission_focus} onChange={e => setForm(f => ({...f, mission_focus: e.target.value}))}
                rows={3} className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Organization Type</label>
                <select value={form.org_type}
                  onChange={e => setForm(f => ({...f, org_type: e.target.value as OrgType}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm">
                  {ORG_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-silver-700 mb-1">Leadership Signal Tier</label>
                <select value={form.leadership_signal_tier}
                  onChange={e => setForm(f => ({...f, leadership_signal_tier: e.target.value as LeadershipSignalTier}))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm">
                  <option value="confirmed">Confirmed</option>
                  <option value="inferred">Inferred</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-silver-200">
              <button onClick={deleteOrg}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button onClick={saveOrg} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-plum-800 text-white rounded-lg hover:bg-plum-700 text-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <button onClick={() => setShowContactForm(!showContactForm)}
            className="flex items-center gap-2 px-4 py-2 bg-plum-800 text-white rounded-lg hover:bg-plum-700 text-sm">
            <Plus className="w-4 h-4" /> Add Contact
          </button>

          {showContactForm && (
            <div className="bg-white rounded-xl border border-silver-200 p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Name *" value={contactForm.contact_name}
                  onChange={e => setContactForm(f => ({...f, contact_name: e.target.value}))}
                  className="px-3 py-2 border border-silver-300 rounded-lg text-sm" />
                <input placeholder="Position" value={contactForm.contact_position}
                  onChange={e => setContactForm(f => ({...f, contact_position: e.target.value}))}
                  className="px-3 py-2 border border-silver-300 rounded-lg text-sm" />
                <input placeholder="Email" value={contactForm.contact_email}
                  onChange={e => setContactForm(f => ({...f, contact_email: e.target.value}))}
                  className="px-3 py-2 border border-silver-300 rounded-lg text-sm" />
                <input placeholder="LinkedIn URL" value={contactForm.contact_linkedin}
                  onChange={e => setContactForm(f => ({...f, contact_linkedin: e.target.value}))}
                  className="px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              </div>
              <textarea placeholder="Bio" value={contactForm.contact_bio}
                onChange={e => setContactForm(f => ({...f, contact_bio: e.target.value}))}
                rows={2} className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
              <select value={contactForm.review_status}
                onChange={e => setContactForm(f => ({...f, review_status: e.target.value}))}
                className="px-3 py-2 border border-silver-300 rounded-lg text-sm">
                <option value="Pending Review">Pending Review</option>
                <option value="Lead for Business">Lead for Business</option>
                <option value="Lead for Review">Lead for Review</option>
                <option value="Do NOT Contact">Do NOT Contact</option>
              </select>
              <div className="flex gap-2">
                <button onClick={addContact}
                  className="px-4 py-2 bg-plum-800 text-white rounded-lg text-sm hover:bg-plum-700">Save</button>
                <button onClick={() => setShowContactForm(false)}
                  className="px-4 py-2 text-silver-600 hover:bg-silver-100 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {contacts.length === 0 ? (
            <p className="text-sm text-silver-500 py-8 text-center">No contacts added yet.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map(c => (
                <div key={c.id} className="bg-white rounded-xl border border-silver-200 p-4 flex items-start gap-4">
                  <div className="p-2 bg-plum-50 rounded-lg mt-0.5">
                    <User className="w-5 h-5 text-plum-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-silver-900 text-sm">{c.contact_name}</p>
                      {c.review_status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${reviewStatusStyles[c.review_status] || ''}`}>
                          {c.review_status}
                        </span>
                      )}
                    </div>
                    {c.contact_position && <p className="text-xs text-silver-500">{c.contact_position}</p>}
                    <div className="flex gap-3 mt-1">
                      {c.contact_email && <span className="text-xs text-ocean-600">{c.contact_email}</span>}
                    </div>
                    {c.contact_bio && <p className="text-xs text-silver-500 mt-1">{c.contact_bio}</p>}
                    {c.host_producer_notes && <p className="text-xs text-silver-400 italic mt-1">{c.host_producer_notes}</p>}
                  </div>
                  <button onClick={() => deleteContact(c.id)} className="p-1.5 text-silver-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-silver-200 p-5 space-y-3">
            <div className="flex gap-3">
              <select value={noteForm.type} onChange={e => setNoteForm(f => ({...f, type: e.target.value}))}
                className="px-3 py-2 border border-silver-300 rounded-lg text-sm">
                <option value="general">General</option>
                <option value="qualification">Qualification</option>
                <option value="briefing">Briefing</option>
                <option value="call_note">Call Note</option>
              </select>
            </div>
            <textarea value={noteForm.content} onChange={e => setNoteForm(f => ({...f, content: e.target.value}))}
              rows={3} placeholder="Add a note..."
              className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm" />
            <button onClick={addNote} disabled={!noteForm.content.trim()}
              className="px-4 py-2 bg-plum-800 text-white rounded-lg text-sm hover:bg-plum-700 disabled:opacity-50">
              Add Note
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-sm text-silver-500 py-8 text-center">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="bg-white rounded-xl border border-silver-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      n.type === 'qualification' ? 'bg-amber-100 text-amber-800' :
                      n.type === 'briefing' ? 'bg-purple-100 text-purple-800' :
                      n.type === 'call_note' ? 'bg-blue-100 text-blue-800' :
                      'bg-silver-100 text-silver-700'
                    }`}>
                      {n.type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-silver-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                      <button onClick={() => deleteNote(n.id)} className="text-silver-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-silver-700 whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'outreach' && (
        <div className="space-y-4">
          <Link href={`/outreach?orgId=${org.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-plum-800 text-white rounded-lg hover:bg-plum-700 text-sm">
            <Mail className="w-4 h-4" /> Go to Outreach Studio
          </Link>

          {drafts.length === 0 ? (
            <p className="text-sm text-silver-500 py-8 text-center">No outreach drafts yet.</p>
          ) : (
            <div className="space-y-3">
              {drafts.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-silver-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-silver-100 text-silver-700'
                    }`}>
                      {d.status}
                    </span>
                    <span className="text-xs text-silver-400">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  {d.subject_line && <p className="text-sm font-medium text-silver-800 mb-1">Subject: {d.subject_line}</p>}
                  <p className="text-sm text-silver-700 whitespace-pre-wrap line-clamp-6">{d.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
