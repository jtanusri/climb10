'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import type { FollowUpReminder } from '@/lib/db/types';
import Link from 'next/link';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/brief': 'Brief & Discovery',
  '/discovery': 'Brief & Discovery',
  '/map': 'Brief & Discovery',
  '/pipeline': 'Pipeline',
  '/outreach': 'Outreach Studio',
  '/briefing': 'Briefing Notes',
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[pathname] || (pathname.startsWith('/pipeline/') ? 'Organization Detail' : 'Climb10');

  useEffect(() => {
    fetch('/api/reminders')
      .then(r => r.json())
      .then(data => setReminders(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dismissReminder = async (id: number) => {
    await fetch(`/api/reminders/${id}`, { method: 'PUT' });
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-silver-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="pl-12 lg:pl-0">
          <h1 className="text-xl font-semibold text-silver-900">{title}</h1>
        </div>
        <div className="relative flex items-center gap-4" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative p-2 rounded-lg hover:bg-silver-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-silver-600" />
            {reminders.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-plum-700 text-white text-xs rounded-full flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-silver-200 shadow-lg z-50">
              <div className="p-3 border-b border-silver-100">
                <h3 className="font-semibold text-sm text-silver-900">Follow-up Reminders</h3>
              </div>
              {reminders.length === 0 ? (
                <div className="p-4 text-center text-sm text-silver-500">No pending reminders</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {reminders.map(r => (
                    <div key={r.id} className="p-3 border-b border-silver-50 hover:bg-silver-50">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/pipeline/${r.organization_id}`}
                          onClick={() => setDropdownOpen(false)}
                          className="text-sm font-medium text-plum-800 hover:underline"
                        >
                          {r.org_name}
                        </Link>
                        <button
                          onClick={() => dismissReminder(r.id)}
                          className="text-xs text-silver-400 hover:text-silver-600 whitespace-nowrap"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-xs text-silver-500 mt-0.5">{r.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
