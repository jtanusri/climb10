'use client';

import { useState } from 'react';
import { KEYWORD_CATEGORIES, type KeywordCategory } from '@/lib/db/types';

interface AddOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOrgModal({ isOpen, onClose, onSuccess }: AddOrgModalProps) {
  const [form, setForm] = useState({
    name: '',
    location: '',
    website: '',
    keyword_category: '' as KeywordCategory | '',
    mission_focus: '',
    estimated_budget: '',
    estimated_size: '',
    city: '',
    state: '',
    country: '',
    contact_name: '',
    contact_email: '',
    contact_position: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Organization name is required');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          location: [form.city, form.state, form.country].filter(Boolean).join(', ') || form.location.trim(),
          website: form.website.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim(),
          keyword_category: form.keyword_category,
          mission_focus: form.mission_focus.trim(),
          estimated_budget: form.estimated_budget.trim(),
          estimated_size: form.estimated_size.trim(),
          source: 'manual',
          stage: 'identified',
          leadership_signal_tier: 'unknown',
          leadership_signal_evidence: '',
          contact_name: form.contact_name.trim(),
          contact_email: form.contact_email.trim(),
          contact_position: form.contact_position.trim(),
          review_status: form.contact_name ? 'Pending Review' : undefined,
          host_producer_notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add organization');
        return;
      }
      setForm({
        name: '', location: '', website: '', keyword_category: '',
        mission_focus: '', estimated_budget: '', estimated_size: '',
        city: '', state: '', country: '',
        contact_name: '', contact_email: '', contact_position: '', notes: '',
      });
      onSuccess();
      onClose();
    } catch {
      setError('Failed to add organization. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white border-b border-silver-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-silver-900">Add Organization</h2>
            <button onClick={onClose} className="text-silver-400 hover:text-silver-600 text-xl leading-none">&times;</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-1">Organization Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
              placeholder="e.g., Ocean Conservancy"
            />
          </div>

          {/* City / State / Country */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                placeholder="Halifax"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-1">State / Region</label>
              <input
                type="text"
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                placeholder="Nova Scotia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-1">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                placeholder="Canada"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-1">Website</label>
            <input
              type="text"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
              placeholder="https://..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-1">Category</label>
            <select
              value={form.keyword_category}
              onChange={e => setForm(f => ({ ...f, keyword_category: e.target.value as KeywordCategory }))}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 bg-white"
            >
              <option value="">Select a category...</option>
              {KEYWORD_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Budget & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-1">Est. Budget</label>
              <input
                type="text"
                value={form.estimated_budget}
                onChange={e => setForm(f => ({ ...f, estimated_budget: e.target.value }))}
                className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                placeholder="e.g., $5M"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-silver-700 mb-1">Est. Size</label>
              <input
                type="text"
                value={form.estimated_size}
                onChange={e => setForm(f => ({ ...f, estimated_size: e.target.value }))}
                className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                placeholder="e.g., ~50 people"
              />
            </div>
          </div>

          {/* Mission / Focus */}
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-1">Mission / Focus</label>
            <textarea
              value={form.mission_focus}
              onChange={e => setForm(f => ({ ...f, mission_focus: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
              placeholder="What does this organization do?"
            />
          </div>

          {/* Lead Contact section */}
          <div className="border-t border-silver-200 pt-4">
            <h3 className="text-sm font-medium text-silver-600 mb-3">Lead Contact (optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-silver-500 mb-1">Name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs text-silver-500 mb-1">Position</label>
                <input
                  type="text"
                  value={form.contact_position}
                  onChange={e => setForm(f => ({ ...f, contact_position: e.target.value }))}
                  className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                  placeholder="CEO"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-silver-500 mb-1">Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
                placeholder="jane@org.com"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400"
              placeholder="Any context about this org or how you found them..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-silver-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-silver-600 hover:text-silver-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-ocean-600 hover:bg-ocean-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
