import { getAllOrgs } from '@/lib/db/organizations';
import OutreachStudio from '@/components/outreach/outreach-studio';

export const dynamic = 'force-dynamic';

export default function OutreachPage() {
  const orgs = getAllOrgs();
  return <OutreachStudio orgs={orgs} />;
}
