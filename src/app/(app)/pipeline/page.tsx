import { ensureMigrations } from '@/lib/db';
import { getAllOrgs } from '@/lib/db/organizations';
import KanbanBoard from '@/components/pipeline/kanban-board';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  await ensureMigrations();
  const orgs = await getAllOrgs();
  return <KanbanBoard initialOrgs={orgs} />;
}
