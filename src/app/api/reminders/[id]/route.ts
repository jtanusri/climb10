import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { completeReminder } from '@/lib/db/reminders';

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const success = await completeReminder(Number(id));
  if (!success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
