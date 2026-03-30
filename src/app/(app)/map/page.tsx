import { ensureMigrations } from '@/lib/db';
import { getAllOrgs } from '@/lib/db/organizations';
import DiscoveryMap from '@/components/map/discovery-map';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  await ensureMigrations();
  const orgs = await getAllOrgs();

  // Prepare map orgs with deterministic jitter for co-located markers
  // ~0.001° ≈ 100m — enough to separate overlapping pins without displacing them
  const jitterOffsets = [
    [0, 0], [0.0012, 0.0009], [-0.0009, 0.0015], [0.0015, -0.0012],
    [-0.0015, -0.0006], [0.0006, 0.0018], [-0.0018, 0.0003], [0.0003, -0.0018],
    [0.0020, 0.0010], [-0.0010, 0.0020], [0.0008, -0.0020], [-0.0020, -0.0008],
  ];
  const seenCoords = new Map<string, number>();
  const mapOrgs = orgs
    .filter(o => o.lat && o.lng)
    .map(o => {
      const key = `${o.lat!.toFixed(3)},${o.lng!.toFixed(3)}`;
      const count = seenCoords.get(key) || 0;
      seenCoords.set(key, count + 1);
      const offset = count > 0 ? (jitterOffsets[count % jitterOffsets.length]) : [0, 0];
      return {
        id: o.id,
        name: o.name,
        location: o.location,
        estimated_budget: o.estimated_budget,
        mission_focus: o.mission_focus,
        stage: o.stage,
        keyword_category: o.keyword_category || 'sector',
        signal_strength: o.signal_strength || 'strong',
        leadership_signal_tier: o.leadership_signal_tier,
        lat: o.lat! + offset[0],
        lng: o.lng! + offset[1],
      };
    });

  return (
    <div className="max-w-7xl mx-auto">
      <DiscoveryMap orgs={mapOrgs} fullPage />
    </div>
  );
}
