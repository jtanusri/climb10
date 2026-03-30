import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getContactsByOrg, createContact } from '@/lib/db/contacts';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const contacts = await getContactsByOrg(Number(id));
  return NextResponse.json(contacts);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const data = await request.json();
  const contact = await createContact({ ...data, organization_id: Number(id) });
  return NextResponse.json(contact);
}
