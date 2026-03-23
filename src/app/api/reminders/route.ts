import { NextResponse } from 'next/server';
import { getActiveReminders } from '@/lib/db/reminders';

export async function GET() {
  const reminders = getActiveReminders();
  return NextResponse.json(reminders);
}
