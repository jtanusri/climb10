'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { KEYWORD_CATEGORIES, SIGNAL_STRENGTHS } from '@/lib/db/types';
import type { KeywordCategory, SignalStrength } from '@/lib/db/types';

const LeafletMap = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-lg bg-silver-100 flex items-center justify-center" style={{ minHeight: 500 }}>
      <span className="text-silver-500 text-sm">Loading map...</span>
    </div>
  ),
});

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

const CATEGORY_ICON_PATHS: Record<string, string> = {
  sector: '/sector.png',
  infra: '/infrastructure.png',
  econ: '/economic.png',
  sci: '/scientific.png',
  gov: '/governance.png',
  cons: '/cons.png',
  food: '/food.png',
  donor: '/donor.png',
  investor: '/investor.png',
};

const CATEGORY_SELECTED_ICON_PATHS: Record<string, string> = {
  sector: '/sector-selected.png',
  infra: '/infrastructure-selected.png',
  econ: '/economic-selected.png',
  sci: '/scientific-selected.png',
  gov: '/governance-selected.png',
  cons: '/cons-selected.png',
  food: '/food-selected.png',
  donor: '/donor.png',
  investor: '/investor.png',
};

function getCategoryColor(cat: string): string {
  return KEYWORD_CATEGORIES.find(c => c.value === cat)?.color || '#666';
}

export default function DiscoveryMap({ orgs, fullPage = false }: { orgs: MapOrg[]; fullPage?: boolean }) {
  const [catFilter, setCatFilter] = useState<KeywordCategory | 'all'>('all');
  const [sigFilter, setSigFilter] = useState<SignalStrength | 'all'>('all');
  const [showRadius, setShowRadius] = useState(true);

  const filteredOrgs = orgs.filter(o => {
    if (catFilter !== 'all' && o.keyword_category !== catFilter) return false;
    if (sigFilter !== 'all' && o.signal_strength !== sigFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Map container with overlaid top bar */}
      <div className="bg-white rounded-xl border border-silver-200 overflow-hidden relative">
        {/* Radius toggle — left side, below zoom controls */}
        <div className="absolute top-[120px] left-[10px] z-[1000]">
          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shadow-md ${
              showRadius
                ? 'bg-ocean-600 text-white'
                : 'bg-white text-silver-600 hover:bg-silver-50 border border-silver-200'
            }`}
          >
            <MapPin className="w-3 h-3" />
            15mi
          </button>
        </div>

        {/* Category filters — top-left overlay, horizontal */}
        <div className="absolute top-3 left-12 z-[1000] flex items-center gap-1.5">
          {KEYWORD_CATEGORIES.map(cat => {
            const isActive = catFilter === cat.value;
            const iconSrc = isActive ? CATEGORY_SELECTED_ICON_PATHS[cat.value] : CATEGORY_ICON_PATHS[cat.value];
            return (
              <button
                key={cat.value}
                onClick={() => setCatFilter(isActive ? 'all' : cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shadow-md ${
                  isActive
                    ? 'text-white'
                    : catFilter !== 'all'
                      ? 'bg-white/70 text-silver-400 hover:bg-white hover:text-silver-600'
                      : 'bg-white text-silver-700 hover:bg-silver-50'
                }`}
                style={isActive ? { backgroundColor: cat.color } : {}}
              >
                {iconSrc && <img src={iconSrc} alt="" className="w-4 h-4 object-contain" />}
                {cat.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Signal strength filters — top-right overlay, vertical */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
          {SIGNAL_STRENGTHS.map(sig => {
            const isActive = sigFilter === sig.value;
            return (
              <button
                key={sig.value}
                onClick={() => setSigFilter(isActive ? 'all' : sig.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shadow-md ${
                  isActive
                    ? 'bg-plum-700 text-white'
                    : sigFilter !== 'all'
                      ? 'bg-white/70 text-silver-400 hover:bg-white hover:text-silver-600'
                      : 'bg-white text-silver-700 hover:bg-silver-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border"
                  style={{
                    backgroundColor: isActive ? 'white' : `rgba(74, 14, 78, ${sig.opacity})`,
                    borderColor: isActive ? 'white' : `rgba(74, 14, 78, ${sig.opacity})`,
                  }}
                />
                {sig.value.charAt(0).toUpperCase() + sig.value.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Map — full width, no padding */}
        <LeafletMap orgs={filteredOrgs} showRadius={showRadius} fullPage={fullPage} />

        {/* Stats bar */}
        <div className="flex items-center justify-between px-4 py-2 text-sm text-silver-600 border-t border-silver-100">
          <span>{filteredOrgs.length} organizations shown</span>
          <span>{orgs.length} total in pipeline</span>
        </div>
      </div>

      {/* Organization List */}
      {filteredOrgs.length > 0 && (
        <div className="bg-white rounded-xl border border-silver-200 p-4">
          <h3 className="font-medium text-silver-900 mb-3 text-sm">Organizations on Map</h3>
          <div className="space-y-2">
            {filteredOrgs.map(org => (
              <Link key={org.id} href={`/pipeline/${org.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-silver-50 text-sm">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(org.keyword_category) }}
                >
                  {CATEGORY_SELECTED_ICON_PATHS[org.keyword_category] && <img src={CATEGORY_SELECTED_ICON_PATHS[org.keyword_category]} alt="" className="w-4 h-4 object-contain" />}
                </div>
                <span className="font-medium text-silver-900">{org.name}</span>
                <span className="text-silver-500">{org.estimated_budget}</span>
                <span className="text-xs text-silver-400 ml-auto">{org.stage.replace(/_/g, ' ')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
