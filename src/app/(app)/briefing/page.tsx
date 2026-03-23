import { getAllOrgs } from '@/lib/db/organizations';
import BriefingGenerator from '@/components/briefing/briefing-generator';

export const dynamic = 'force-dynamic';

export default function BriefingPage() {
  const orgs = getAllOrgs();
  return <BriefingGenerator orgs={orgs} />;
}
