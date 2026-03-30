import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getActiveReminders } from '@/lib/db/reminders';

export async function GET() {
  await ensureMigrations();
  const reminders = await getActiveReminders();
  return NextResponse.json(reminders);
}
