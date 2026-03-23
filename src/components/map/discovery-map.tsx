'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Filter, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { KEYWORD_CATEGORIES, SIGNAL_STRENGTHS, SIGNAL_TIER_DISPLAY } from '@/lib/db/types';
import type { KeywordCategory, SignalStrength } from '@/lib/db/types';

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

// Halifax center coordinates
const HALIFAX_CENTER = { lat: 44.6488, lng: -63.5752 };
const RADIUS_DEGREES = 0.33; // ~15 miles
const BASE_PIXELS_PER_DEGREE = 600;

const ZOOM_LEVELS = [
  { label: '5mi', scale: 3.0 },
  { label: '10mi', scale: 1.8 },
  { label: '15mi', scale: 1.0 },
  { label: '30mi', scale: 0.5 },
  { label: '50mi', scale: 0.3 },
];
const DEFAULT_ZOOM_INDEX = 2; // 15mi view

function getCategoryColor(cat: string): string {
  const found = KEYWORD_CATEGORIES.find(c => c.value === cat);
  return found?.color || '#666';
}

function getSignalRadius(sig: string): number {
  const found = SIGNAL_STRENGTHS.find(s => s.value === sig);
  return found?.radius || 5;
}

function getSignalOpacity(sig: string): number {
  const found = SIGNAL_STRENGTHS.find(s => s.value === sig);
  return found?.opacity || 0.7;
}

export default function DiscoveryMap({ orgs }: { orgs: MapOrg[] }) {
  const [catFilter, setCatFilter] = useState<KeywordCategory | 'all'>('all');
  const [sigFilter, setSigFilter] = useState<SignalStrength | 'all'>('all');
  const [hoveredOrg, setHoveredOrg] = useState<MapOrg | null>(null);
  const [showRadius, setShowRadius] = useState(true);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);

  const width = 800;
  const height = 500;
  const zoomScale = ZOOM_LEVELS[zoomIndex].scale;
  const pixelsPerDegree = BASE_PIXELS_PER_DEGREE * zoomScale;

  // Project lat/lng to SVG coordinates
  function project(lat: number, lng: number) {
    const centerX = width / 2;
    const centerY = height / 2;
    const x = centerX + (lng - HALIFAX_CENTER.lng) * pixelsPerDegree * Math.cos(HALIFAX_CENTER.lat * Math.PI / 180);
    const y = centerY - (lat - HALIFAX_CENTER.lat) * pixelsPerDegree;
    return { x, y };
  }

  const zoomIn = () => setZoomIndex(i => Math.max(0, i - 1));
  const zoomOut = () => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  const resetZoom = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

  const filteredOrgs = orgs.filter(o => {
    if (catFilter !== 'all' && o.keyword_category !== catFilter) return false;
    if (sigFilter !== 'all' && o.signal_strength !== sigFilter) return false;
    return true;
  });

  const center = project(HALIFAX_CENTER.lat, HALIFAX_CENTER.lng);
  const radiusEdge = project(HALIFAX_CENTER.lat + RADIUS_DEGREES, HALIFAX_CENTER.lng);
  const radiusPx = Math.abs(center.y - radiusEdge.y);

  // Scale marker sizes inversely with zoom so they stay readable
  const markerScale = Math.max(0.6, Math.min(2.0, 1 / Math.sqrt(zoomScale)));

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white rounded-xl border border-silver-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-silver-400" />
            <span className="text-sm font-medium text-silver-700">Category:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCatFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  catFilter === 'all' ? 'bg-silver-800 text-white' : 'bg-silver-100 text-silver-600 hover:bg-silver-200'
                }`}
              >
                All
              </button>
              {KEYWORD_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCatFilter(cat.value)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    catFilter === cat.value
                      ? 'text-white font-medium'
                      : 'bg-silver-100 text-silver-600 hover:bg-silver-200'
                  }`}
                  style={catFilter === cat.value ? { backgroundColor: cat.color } : {}}
                >
                  {cat.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-silver-700">Signal:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setSigFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  sigFilter === 'all' ? 'bg-silver-800 text-white' : 'bg-silver-100 text-silver-600 hover:bg-silver-200'
                }`}
              >
                All
              </button>
              {SIGNAL_STRENGTHS.map(sig => (
                <button
                  key={sig.value}
                  onClick={() => setSigFilter(sig.value)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    sigFilter === sig.value ? 'bg-plum-700 text-white font-medium' : 'bg-silver-100 text-silver-600 hover:bg-silver-200'
                  }`}
                >
                  {sig.value}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
              showRadius ? 'bg-ocean-100 text-ocean-700' : 'bg-silver-100 text-silver-600'
            }`}
          >
            <MapPin className="w-3 h-3 inline mr-1" />
            15mi radius
          </button>
        </div>
      </div>

      {/* Map SVG */}
      <div className="bg-white rounded-xl border border-silver-200 p-4 relative">
        {/* Zoom Controls */}
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-1 bg-white rounded-lg border border-silver-200 shadow-sm">
          <button
            onClick={zoomIn}
            disabled={zoomIndex === 0}
            className="p-2 hover:bg-silver-50 rounded-t-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-silver-700" />
          </button>
          <div className="border-t border-silver-200" />
          <button
            onClick={resetZoom}
            className="p-2 hover:bg-silver-50 transition-colors"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5 text-silver-500 mx-auto" />
          </button>
          <div className="border-t border-silver-200" />
          <button
            onClick={zoomOut}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            className="p-2 hover:bg-silver-50 rounded-b-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-silver-700" />
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute top-6 left-6 z-10 flex gap-0.5">
          {ZOOM_LEVELS.map((level, i) => (
            <button
              key={level.label}
              onClick={() => setZoomIndex(i)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                zoomIndex === i
                  ? 'bg-plum-700 text-white font-medium'
                  : 'bg-white/80 text-silver-500 hover:bg-silver-100 border border-silver-200'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>

        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto bg-ocean-50 rounded-lg"
        >
          {/* Water background */}
          <rect width={width} height={height} fill="#E8F4F8" />

          {/* 15-mile radius ring */}
          {showRadius && (
            <circle
              cx={center.x}
              cy={center.y}
              r={radiusPx}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth={1.5}
              strokeDasharray="6 3"
            />
          )}

          {/* Halifax center marker */}
          <circle cx={center.x} cy={center.y} r={3} fill="#4A0E4E" />
          <text x={center.x + 8} y={center.y + 4} fontSize="11" fill="#4A0E4E" fontWeight="600">Halifax</text>

          {/* Organization markers */}
          {filteredOrgs.map(org => {
            const pos = project(org.lat, org.lng);
            const color = getCategoryColor(org.keyword_category);
            const radius = getSignalRadius(org.signal_strength) * 1.5 * markerScale;
            const opacity = getSignalOpacity(org.signal_strength);

            // Don't render if projected outside the SVG bounds
            if (pos.x < -20 || pos.x > width + 20 || pos.y < -20 || pos.y > height + 20) return null;

            return (
              <g key={org.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={color}
                  opacity={catFilter !== 'all' && org.keyword_category !== catFilter ? 0.07 : opacity}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  onMouseEnter={() => setHoveredOrg(org)}
                  onMouseLeave={() => setHoveredOrg(null)}
                  className="cursor-pointer transition-all hover:stroke-2"
                />
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredOrg && (() => {
            const pos = project(hoveredOrg.lat, hoveredOrg.lng);
            // Position tooltip to the right, unless near right edge
            const tipX = pos.x > width - 250 ? pos.x - 235 : pos.x + 15;
            const tipY = pos.y > height - 80 ? pos.y - 75 : pos.y - 10;
            const signalDisplay = SIGNAL_TIER_DISPLAY[hoveredOrg.leadership_signal_tier as keyof typeof SIGNAL_TIER_DISPLAY];

            return (
              <g>
                <rect x={tipX - 4} y={tipY - 28} width={220} height={65} rx={6} fill="white" stroke="#ddd" strokeWidth={1} />
                <text x={tipX + 4} y={tipY - 10} fontSize="12" fontWeight="600" fill="#1a1a2e">{hoveredOrg.name}</text>
                <text x={tipX + 4} y={tipY + 6} fontSize="10" fill="#666">{hoveredOrg.estimated_budget} · {hoveredOrg.location}</text>
                <text x={tipX + 4} y={tipY + 22} fontSize="10" fill="#888">{signalDisplay?.label || 'Unknown'}</text>
              </g>
            );
          })()}
        </svg>

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 text-sm text-silver-600">
          <span>{filteredOrgs.length} organizations shown</span>
          <span className="text-xs text-silver-400">Zoom: {ZOOM_LEVELS[zoomIndex].label} view</span>
          <span>{orgs.length} total in pipeline</span>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-silver-200 p-4">
        <h3 className="font-medium text-silver-900 mb-3 text-sm">Map Legend</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-silver-600 mb-2 uppercase tracking-wide">Color = Category</p>
            <div className="space-y-1.5">
              {KEYWORD_CATEGORIES.map(cat => (
                <div key={cat.value} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-silver-700">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-silver-600 mb-2 uppercase tracking-wide">Size = Signal Strength</p>
            <div className="space-y-1.5">
              {SIGNAL_STRENGTHS.map(sig => (
                <div key={sig.value} className="flex items-center gap-2">
                  <div className="rounded-full bg-silver-500" style={{ width: sig.radius * 2, height: sig.radius * 2, opacity: sig.opacity }} />
                  <span className="text-xs text-silver-700">{sig.label}</span>
                </div>
              ))}
            </div>
          </div>
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
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(org.keyword_category) }} />
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
