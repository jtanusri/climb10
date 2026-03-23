import { getAllOrgs } from '@/lib/db/organizations';
import { getBrief } from '@/lib/db/brief';
import { getActiveReminders } from '@/lib/db/reminders';
import { getRecentActivity } from '@/lib/db/activity';
import { PIPELINE_STAGES } from '@/lib/db/types';
import Link from 'next/link';
import { Search, FileText, ArrowRight, Bell, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const orgs = getAllOrgs();
  const brief = getBrief();
  const reminders = getActiveReminders();
  const activity = getRecentActivity(8);

  const stageCounts = PIPELINE_STAGES.map(s => ({
    ...s,
    count: orgs.filter(o => o.stage === s.value).length,
  }));

  const totalOrgs = orgs.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/brief"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-silver-200 hover:border-plum-300 hover:shadow-md transition-all"
        >
          <div className="p-3 bg-plum-50 rounded-lg">
            <FileText className="w-6 h-6 text-plum-700" />
          </div>
          <div>
            <h3 className="font-semibold text-silver-900">Advisory Brief</h3>
            <p className="text-sm text-silver-500">
              {brief ? 'View & edit criteria' : 'Set up your criteria'}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-silver-400 ml-auto" />
        </Link>

        <Link
          href="/discovery"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-silver-200 hover:border-ocean-300 hover:shadow-md transition-all"
        >
          <div className="p-3 bg-ocean-50 rounded-lg">
            <Search className="w-6 h-6 text-ocean-600" />
          </div>
          <div>
            <h3 className="font-semibold text-silver-900">Run Discovery</h3>
            <p className="text-sm text-silver-500">Find matching organizations</p>
          </div>
          <ArrowRight className="w-5 h-5 text-silver-400 ml-auto" />
        </Link>

        <Link
          href="/pipeline"
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-silver-200 hover:border-lime-300 hover:shadow-md transition-all"
        >
          <div className="p-3 bg-lime-50 rounded-lg">
            <span className="text-lg font-bold text-lime-700">{totalOrgs}</span>
          </div>
          <div>
            <h3 className="font-semibold text-silver-900">Pipeline</h3>
            <p className="text-sm text-silver-500">{totalOrgs} organization{totalOrgs !== 1 ? 's' : ''} tracked</p>
          </div>
          <ArrowRight className="w-5 h-5 text-silver-400 ml-auto" />
        </Link>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Follow-up Reminders</h2>
          </div>
          <div className="space-y-2">
            {reminders.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <Link href={`/pipeline/${r.organization_id}`} className="text-amber-800 hover:underline font-medium">
                  {r.org_name}
                </Link>
                <span className="text-amber-600">- {r.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Summary */}
        <div className="bg-white rounded-xl border border-silver-200 p-5">
          <h2 className="font-semibold text-silver-900 mb-4">Pipeline Overview</h2>
          {totalOrgs === 0 ? (
            <p className="text-sm text-silver-500">No organizations in pipeline yet. Run a discovery search to get started.</p>
          ) : (
            <div className="space-y-3">
              {stageCounts.filter(s => s.count > 0).map(s => (
                <div key={s.value} className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                    {s.label}
                  </span>
                  <div className="flex-1 bg-silver-100 rounded-full h-2">
                    <div
                      className="bg-plum-600 h-2 rounded-full transition-all"
                      style={{ width: `${(s.count / totalOrgs) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-silver-700 w-6 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-silver-200 p-5">
          <h2 className="font-semibold text-silver-900 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-silver-500">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    a.type === 'stage_change' ? 'bg-plum-500' : 'bg-ocean-500'
                  }`} />
                  <div>
                    <Link href={`/pipeline/${a.org_id}`} className="font-medium text-silver-800 hover:text-plum-700">
                      {a.org_name}
                    </Link>
                    <span className="text-silver-500 ml-1">{a.description}</span>
                    <p className="text-xs text-silver-400">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
