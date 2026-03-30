import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getOrgById, updateOrg, deleteOrg } from '@/lib/db/organizations';
import { getContactsByOrg } from '@/lib/db/contacts';
import { getNotesByOrg } from '@/lib/db/notes';
import { getDraftsByOrg } from '@/lib/db/outreach';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const org = await getOrgById(Number(id));
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const contacts = await getContactsByOrg(org.id);
  const notes = await getNotesByOrg(org.id);
  const drafts = await getDraftsByOrg(org.id);

  return NextResponse.json({ ...org, contacts, notes, drafts });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const data = await request.json();
  const org = await updateOrg(Number(id), data);
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(org);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const success = await deleteOrg(Number(id));
  if (!success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
