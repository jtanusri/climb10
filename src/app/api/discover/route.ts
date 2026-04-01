import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getBrief } from '@/lib/db/brief';
import { createPendingDiscoveryRun } from '@/lib/db/discovery';

/**
 * POST /api/discover
 * Creates a pending discovery run and invokes a Netlify Background Function
 * to run the actual Gemini search (up to 15 min execution time).
 * Returns runId immediately so the client can poll GET /api/discover/[runId].
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

    // Invoke the Netlify Background Function
    // Background functions return 202 immediately and continue executing for up to 15 min
    const url = new URL(request.url);
    const bgFunctionUrl = `${url.origin}/.netlify/functions/run-discovery-background`;

    console.log(`[discover] Invoking background function at ${bgFunctionUrl} for run ${run.id}`);

    // We await the fetch to ensure the request is sent, but the background function
    // returns 202 immediately, so this resolves in milliseconds
    try {
      const bgRes = await fetch(bgFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: run.id, query, radiusMiles }),
      });
      console.log(`[discover] Background function response: ${bgRes.status}`);
    } catch (err) {
      console.error('[discover] Failed to invoke background function:', err);
      // Don't fail the main request — the poll will eventually show 'failed'
    }

    return NextResponse.json({ runId: run.id, status: 'pending' });
  } catch (error) {
    console.error('[discover] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed.' },
      { status: 500 }
    );
  }
}
