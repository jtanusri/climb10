import { NextResponse } from 'next/server';
import { getBrief, upsertBrief } from '@/lib/db/brief';

export async function GET() {
  const brief = getBrief();
  return NextResponse.json(brief);
}

export async function POST(request: Request) {
  const data = await request.json();
  const brief = upsertBrief(data);
  return NextResponse.json(brief);
}
