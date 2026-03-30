import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getBrief, upsertBrief } from '@/lib/db/brief';

export async function GET() {
  await ensureMigrations();
  const brief = await getBrief();
  return NextResponse.json(brief);
}

export async function POST(request: Request) {
  await ensureMigrations();
  const data = await request.json();
  const brief = await upsertBrief(data);
  return NextResponse.json(brief);
}
