# Plan: Move Map to Its Own Top-Level Sidebar Tab

## Current State
- The map is embedded at the bottom of the "Brief & Discovery" page (`/brief`)
- `/map` currently just redirects to `/brief`
- BriefHub renders: `DiscoveryPanel` + `DiscoveryMap` vertically stacked
- Users have to scroll past discovery results to reach the map

## Changes

### 1. Add "Map" to sidebar navigation
**File:** `src/components/layout/sidebar.tsx`
- Add a new nav item: `{ href: '/map', label: 'Map', icon: Map }` (Lucide `Map` icon)
- Position it after "Brief & Discovery" since the map is a visual companion to discovery

### 2. Create standalone `/map` page
**File:** `src/app/(app)/map/page.tsx`
- Replace the redirect with a real server component
- Fetch all orgs with lat/lng (same query as brief page)
- Apply the same jitter logic for co-located markers
- Render `<DiscoveryMap orgs={mapOrgs} />` directly — full page, no scroll needed

### 3. Remove map from BriefHub
**File:** `src/components/brief/brief-hub.tsx`
- Remove the `<DiscoveryMap>` render and its import
- Remove `mapOrgs` from props
- Keep DiscoveryPanel as the sole content

**File:** `src/app/(app)/brief/page.tsx`
- Remove the mapOrgs construction logic (jitter offsets, seenCoords, etc.)
- Remove `mapOrgs` from BriefHub props

### 4. Make map full-height
**File:** `src/components/map/discovery-map.tsx`
- Increase map height from 500px to fill available viewport height
- This gives the map proper real estate as a dedicated page

## Result
- Sidebar: Dashboard | Brief & Discovery | **Map** | Pipeline | Outreach Studio | Briefing Notes
- `/map` renders a full-page interactive map with all org markers, filters, and org list
- `/brief` focuses purely on discovery controls and results
