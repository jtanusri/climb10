import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getNotesByOrg, createNote, getNotesByType } from '@/lib/db/notes';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const notes = type ? await getNotesByType(Number(id), type) : await getNotesByOrg(Number(id));
  return NextResponse.json(notes);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const data = await request.json();
  const note = await createNote({ ...data, organization_id: Number(id) });
  return NextResponse.json(note);
}
