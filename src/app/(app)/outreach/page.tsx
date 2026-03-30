import { ensureMigrations } from '@/lib/db';
import { getAllOrgs } from '@/lib/db/organizations';
import OutreachStudio from '@/components/outreach/outreach-studio';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  await ensureMigrations();
  const orgs = await getAllOrgs();
  return <OutreachStudio orgs={orgs} />;
}
