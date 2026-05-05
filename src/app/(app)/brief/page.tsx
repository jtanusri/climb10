import { ensureMigrations } from '@/lib/db';
import { getBrief } from '@/lib/db/brief';
import { getDiscoveryRuns } from '@/lib/db/discovery';
import BriefHub from '@/components/brief/brief-hub';

export const dynamic = 'force-dynamic';

export default async function BriefPage() {
  await ensureMigrations();
  const brief = await getBrief();
  const runs = await getDiscoveryRuns();

  return (
    <BriefHub
      initialBrief={brief}
      pastRuns={runs}
    />
  );
}
