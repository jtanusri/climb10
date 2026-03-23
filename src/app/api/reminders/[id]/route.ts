import { NextResponse } from 'next/server';
import { completeReminder } from '@/lib/db/reminders';

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const success = completeReminder(Number(id));
  if (!success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
