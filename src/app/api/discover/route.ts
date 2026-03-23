import { NextResponse } from 'next/server';
import { getBrief } from '@/lib/db/brief';
import { runDiscovery } from '@/lib/ai/discovery';

export async function POST(request: Request) {
  try {
    const brief = getBrief();
    if (!brief) {
      return NextResponse.json({ error: 'Please complete your advisory brief first.' }, { status: 400 });
    }

    const body = await request.json();
    const radiusMiles: number | undefined = body.radiusMiles;
    const { results, runId } = await runDiscovery(brief, body.query, radiusMiles);

    return NextResponse.json({ results, runId });
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed. Check your Gemini API key.' },
      { status: 500 }
    );
  }
}
