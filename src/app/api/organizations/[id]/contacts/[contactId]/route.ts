import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { updateContact, deleteContact } from '@/lib/db/contacts';

export async function PUT(request: Request, { params }: { params: Promise<{ contactId: string }> }) {
  await ensureMigrations();
  const { contactId } = await params;
  const data = await request.json();
  const contact = await updateContact(Number(contactId), data);
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(contact);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ contactId: string }> }) {
  await ensureMigrations();
  const { contactId } = await params;
  const success = await deleteContact(Number(contactId));
  if (!success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
