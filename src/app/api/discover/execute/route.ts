import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getBrief } from '@/lib/db/brief';
import { executeDiscoveryForRun } from '@/lib/ai/discovery';
import { failDiscoveryRun } from '@/lib/db/discovery';

// Edge runtime for longer execution time (no 10s serverless limit)
export const runtime = 'edge';

/**
 * POST /api/discover/execute
 * Called internally by /api/discover to run the actual Gemini search.
 * Updates the discovery_run in Turso when complete or failed.
 */
export async function POST(request: Request) {
  try {
    const { runId, query, radiusMiles } = await request.json();

    await ensureMigrations();

    const brief = await getBrief();
    if (!brief) {
      await failDiscoveryRun(runId, 'No advisory brief found');
      return NextResponse.json({ error: 'No brief' }, { status: 400 });
    }

    // This is the long-running Gemini call (20-60s)
    await executeDiscoveryForRun(runId, brief, query, radiusMiles);

    return NextResponse.json({ status: 'complete' });
  } catch (error) {
    console.error('[discover/execute] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execute failed' },
      { status: 500 }
    );
  }
}
