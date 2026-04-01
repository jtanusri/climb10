import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getBrief } from '@/lib/db/brief';
import { createPendingDiscoveryRun } from '@/lib/db/discovery';

/**
 * POST /api/discover
 * Creates a pending discovery run and kicks off the Gemini search
 * via the /api/discover/execute endpoint (fire-and-forget).
 * Returns the runId immediately so the client can poll for results.
 */
export async function POST(request: Request) {
  try {
    await ensureMigrations();

    const brief = await getBrief();
    if (!brief) {
      return NextResponse.json({ error: 'Please complete your advisory brief first.' }, { status: 400 });
    }

    const body = await request.json();
    const radiusMiles: number | undefined = body.radiusMiles;
    const query: string | undefined = body.query;

    // Create a pending run in Turso
    const run = await createPendingDiscoveryRun({
      brief_id: brief.id,
      query: query || `Default search for ${brief.geography}`,
    });

    // Fire-and-forget: trigger the execute endpoint
    // Use the request URL to build the absolute URL for the execute endpoint
    const url = new URL(request.url);
    const executeUrl = `${url.origin}/api/discover/execute`;

    fetch(executeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId: run.id, query, radiusMiles }),
    }).catch(err => {
      console.error('[discover] Failed to trigger execute:', err);
    });

    // Return immediately with the runId
    return NextResponse.json({ runId: run.id, status: 'pending' });
  } catch (error) {
    console.error('[discover] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed.' },
      { status: 500 }
    );
  }
}
