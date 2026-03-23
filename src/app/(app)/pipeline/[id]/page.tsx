import { getOrgById } from '@/lib/db/organizations';
import { getContactsByOrg } from '@/lib/db/contacts';
import { getNotesByOrg } from '@/lib/db/notes';
import { getDraftsByOrg } from '@/lib/db/outreach';
import { notFound } from 'next/navigation';
import OrgDetail from '@/components/pipeline/org-detail';

export const dynamic = 'force-dynamic';

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = getOrgById(Number(id));
  if (!org) notFound();

  const contacts = getContactsByOrg(org.id);
  const notes = getNotesByOrg(org.id);
  const drafts = getDraftsByOrg(org.id);

  return <OrgDetail org={org} contacts={contacts} notes={notes} drafts={drafts} />;
}
