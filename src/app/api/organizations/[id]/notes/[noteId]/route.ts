import { NextResponse } from 'next/server';
import { deleteNote } from '@/lib/db/notes';

export async function DELETE(_request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  const success = deleteNote(Number(noteId));
  if (!success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
