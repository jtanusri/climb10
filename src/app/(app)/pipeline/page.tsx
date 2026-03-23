import { getAllOrgs } from '@/lib/db/organizations';
import KanbanBoard from '@/components/pipeline/kanban-board';

export const dynamic = 'force-dynamic';

export default function PipelinePage() {
  const orgs = getAllOrgs();
  return <KanbanBoard initialOrgs={orgs} />;
}
