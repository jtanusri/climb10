'use client';

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { KEYWORD_CATEGORIES, SIGNAL_TIER_DISPLAY } from '@/lib/db/types';
import type { LeadershipSignalTier } from '@/lib/db/types';
import 'leaflet/dist/leaflet.css';

// Auto-fit map bounds to all markers
function FitBounds({ orgs }: { orgs: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (orgs.length === 0) return;
    const bounds = L.latLngBounds(orgs.map(o => [o.lat, o.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [map, orgs]);
  return null;
}

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

const HALIFAX_CENTER: [number, number] = [44.6488, -63.5752];
const RADIUS_METERS = 24140; // ~15 miles

// PNG icon paths for each category (from /public folder)
const CATEGORY_ICON_PATHS: Record<string, string> = {
  sector: '/sector.png',
  infra: '/infrastructure.png',
  econ: '/economic.png',
  sci: '/scientific.png',
  gov: '/governance.png',
  cons: '/cons.png',
  food: '/food.png',
};

function getCategoryColor(cat: string): string {
  return KEYWORD_CATEGORIES.find(c => c.value === cat)?.color || '#666';
}

// Signal strength styling
const SIGNAL_STYLES: Record<string, { opacity: number; ring: boolean }> = {
  high: { opacity: 1.0, ring: true },
  strong: { opacity: 0.9, ring: true },
  supplemental: { opacity: 0.65, ring: false },
  careful: { opacity: 0.45, ring: false },
};

function createPinMarker(cat: string, signal: string): L.DivIcon {
  const color = getCategoryColor(cat);
  const iconPath = CATEGORY_ICON_PATHS[cat] || '';
  const style = SIGNAL_STYLES[signal] || SIGNAL_STYLES.supplemental;

  const ringStyle = style.ring
    ? `filter: drop-shadow(0 0 4px ${color}60);`
    : '';

  const html = `
    <div style="
      position: relative;
      width: 36px;
      height: 46px;
      opacity: ${style.opacity};
      ${ringStyle}
    ">
      <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 2C9.16 2 2 9.16 2 18c0 12 16 25 16 25s16-13 16-25C34 9.16 26.84 2 18 2z" fill="white" stroke="${color}" stroke-width="2.5" />
      </svg>
      <div style="
        position: absolute;
        top: 5px;
        left: 0;
        width: 36px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        ${iconPath ? `<img src="${iconPath}" style="width: 18px; height: 18px; object-fit: contain; display: block;" />` : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -46],
  });
}

export default function LeafletMap({
  orgs,
  showRadius,
  fullPage = false,
}: {
  orgs: MapOrg[];
  showRadius: boolean;
  fullPage?: boolean;
}) {
  const orgIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    for (const org of orgs) {
      const key = `${org.keyword_category}-${org.signal_strength}`;
      if (!icons.has(key)) {
        icons.set(key, createPinMarker(org.keyword_category, org.signal_strength));
      }
    }
    return icons;
  }, [orgs]);

  return (
    <MapContainer
      center={HALIFAX_CENTER}
      zoom={11}
      scrollWheelZoom={true}
      className="w-full rounded-lg"
      style={{ height: fullPage ? 'calc(100vh - 140px)' : 500 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds orgs={orgs} />

      {showRadius && (
        <Circle
          center={HALIFAX_CENTER}
          radius={RADIUS_METERS}
          pathOptions={{
            color: 'rgba(56, 189, 248, 0.4)',
            fillColor: 'rgba(56, 189, 248, 0.08)',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '6 3',
          }}
        />
      )}

      {orgs.map(org => {
        const key = `${org.keyword_category}-${org.signal_strength}`;
        const icon = orgIcons.get(key)!;
        const signalDisplay = SIGNAL_TIER_DISPLAY[org.leadership_signal_tier as LeadershipSignalTier];

        return (
          <Marker
            key={org.id}
            position={[org.lat, org.lng]}
            icon={icon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-silver-900">{org.name}</p>
                <p className="text-silver-600">{org.estimated_budget} &middot; {org.location}</p>
                <p className="text-silver-500 text-xs">{signalDisplay?.label || 'Unknown'}</p>
                <Link
                  href={`/pipeline/${org.id}`}
                  className="text-xs text-ocean-600 hover:underline mt-1 inline-block"
                >
                  View in pipeline &rarr;
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
