import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { getDiscoveryRunById } from '@/lib/db/discovery';

/**
 * GET /api/discover/[runId]
 * Poll endpoint — returns the status and results of a discovery run.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    await ensureMigrations();

    const { runId } = await params;
    const run = await getDiscoveryRunById(Number(runId));

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (run.status === 'pending') {
      return NextResponse.json({ status: 'pending', runId: run.id });
    }

    if (run.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: run.error || 'Discovery failed' }, { status: 500 });
    }

    // status === 'complete'
    let results = [];
    try {
      results = JSON.parse(run.results_json);
    } catch {
      results = [];
    }

    return NextResponse.json({
      status: 'complete',
      results,
      runId: run.id,
    });
  } catch (error) {
    console.error('[discover/poll] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Poll failed' },
      { status: 500 }
    );
  }
}
