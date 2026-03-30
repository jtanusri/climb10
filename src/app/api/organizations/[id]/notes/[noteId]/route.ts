import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { deleteNote } from '@/lib/db/notes';

export async function DELETE(_request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  await ensureMigrations();
  const { noteId } = await params;
  const success = await deleteNote(Number(noteId));
  if (!success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
