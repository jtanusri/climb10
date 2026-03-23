'use client';

import { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import type { Brief } from '@/lib/db/types';

interface BriefFormProps {
  initialBrief: Brief | null;
}

export default function BriefForm({ initialBrief }: BriefFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    geography: initialBrief?.geography || 'Halifax, Nova Scotia',
    radius_miles: initialBrief?.radius_miles || 15,
  });

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save brief:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Geography */}
      <section className="bg-white rounded-xl border border-silver-200 p-6">
        <h2 className="text-lg font-semibold text-plum-800 mb-4">Geography</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-1">Location</label>
            <input
              type="text"
              value={form.geography}
              onChange={e => setForm(f => ({ ...f, geography: e.target.value }))}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg focus:ring-2 focus:ring-plum-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-silver-700 mb-1">Search Radius (miles)</label>
            <input
              type="number"
              value={form.radius_miles}
              onChange={e => setForm(f => ({ ...f, radius_miles: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-silver-300 rounded-lg focus:ring-2 focus:ring-plum-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-plum-800 text-white rounded-lg hover:bg-plum-700 disabled:opacity-50 transition-colors font-medium"
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Brief'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
