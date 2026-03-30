import { ensureMigrations } from '@/lib/db';
import { getAllOrgs } from '@/lib/db/organizations';
import BriefingGenerator from '@/components/briefing/briefing-generator';

export const dynamic = 'force-dynamic';

export default async function BriefingPage() {
  await ensureMigrations();
  const orgs = await getAllOrgs();
  return <BriefingGenerator orgs={orgs} />;
}
