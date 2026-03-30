import { ensureMigrations } from '@/lib/db';
import { getOrgById } from '@/lib/db/organizations';
import { getContactsByOrg } from '@/lib/db/contacts';
import { getNotesByOrg } from '@/lib/db/notes';
import { getDraftsByOrg } from '@/lib/db/outreach';
import { notFound } from 'next/navigation';
import OrgDetail from '@/components/pipeline/org-detail';

export const dynamic = 'force-dynamic';

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureMigrations();
  const org = await getOrgById(Number(id));
  if (!org) notFound();

  const contacts = await getContactsByOrg(org.id);
  const notes = await getNotesByOrg(org.id);
  const drafts = await getDraftsByOrg(org.id);

  return <OrgDetail org={org} contacts={contacts} notes={notes} drafts={drafts} />;
}
