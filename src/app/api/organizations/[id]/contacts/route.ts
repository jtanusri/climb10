import { NextResponse } from 'next/server';
import { getContactsByOrg, createContact } from '@/lib/db/contacts';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacts = getContactsByOrg(Number(id));
  return NextResponse.json(contacts);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const contact = createContact({ ...data, organization_id: Number(id) });
  return NextResponse.json(contact);
}
