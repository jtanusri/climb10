import { NextResponse } from 'next/server';
import { updateDraft } from '@/lib/db/outreach';

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const data = await request.json();
  const draft = updateDraft(Number(draftId), data);
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(draft);
}
