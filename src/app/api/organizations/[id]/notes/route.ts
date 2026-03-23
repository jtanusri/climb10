import { NextResponse } from 'next/server';
import { getNotesByOrg, createNote, getNotesByType } from '@/lib/db/notes';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const notes = type ? getNotesByType(Number(id), type) : getNotesByOrg(Number(id));
  return NextResponse.json(notes);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const note = createNote({ ...data, organization_id: Number(id) });
  return NextResponse.json(note);
}
