import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getAllOrgs, createOrg, getOrgsByStage } from '@/lib/db/organizations';
import { createContact } from '@/lib/db/contacts';
import { createNote } from '@/lib/db/notes';
import type { PipelineStage } from '@/lib/db/types';

export async function GET(request: Request) {
  await ensureMigrations();
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage') as PipelineStage | null;

  const orgs = stage ? await getOrgsByStage(stage) : await getAllOrgs();
  return NextResponse.json(orgs);
}

export async function POST(request: Request) {
  const data = await request.json();
  const {
    contact_name, contact_email, contact_position, contact_linkedin,
    contact_bio, review_status, host_producer_notes,
    ...orgData
  } = data;

  await ensureMigrations();
  // Duplicate check — fuzzy match on org name
  const existingOrgs = await getAllOrgs();
  const newNameLower = (orgData.name || '').toLowerCase().trim();
  const duplicate = existingOrgs.find(o => {
    const existingLower = o.name.toLowerCase().trim();
    return existingLower === newNameLower
      || existingLower.includes(newNameLower)
      || newNameLower.includes(existingLower);
  });
  if (duplicate) {
    return NextResponse.json(
      { error: `"${duplicate.name}" is already in your pipeline (stage: ${duplicate.stage.replace(/_/g, ' ')})` },
      { status: 409 }
    );
  }

  const org = await createOrg(orgData);

  // Auto-create contact from lead fields if provided
  if (contact_name) {
    await createContact({
      organization_id: org.id,
      contact_name,
      contact_email: contact_email || '',
      contact_position: contact_position || '',
      contact_linkedin: contact_linkedin || '',
      contact_bio: contact_bio || '',
      review_status: review_status || 'Pending Review',
      host_producer_notes: host_producer_notes || '',
    });
  }

  // Auto-create qualification note from review status & host/producer notes
  if (review_status || host_producer_notes) {
    const noteContent = [
      review_status ? `Review Status: ${review_status}` : '',
      host_producer_notes ? `Notes: ${host_producer_notes}` : '',
      org.leadership_signal_evidence ? `Leadership Signal: ${org.leadership_signal_evidence}` : '',
    ].filter(Boolean).join('\n');
    await createNote({
      organization_id: org.id,
      type: 'qualification',
      content: noteContent,
    });
  }

  return NextResponse.json(org);
}
