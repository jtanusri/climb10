import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { updateDraft } from '@/lib/db/outreach';

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  await ensureMigrations();
  const { draftId } = await params;
  const data = await request.json();
  const draft = await updateDraft(Number(draftId), data);
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(draft);
}
