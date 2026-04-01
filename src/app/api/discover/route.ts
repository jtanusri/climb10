import { ensureMigrations } from '@/lib/db';
import { getBrief } from '@/lib/db/brief';
import { runDiscovery } from '@/lib/ai/discovery';

// Use edge runtime — supports longer timeouts on Netlify (no 10s serverless limit)
// Both @libsql/client (HTTP) and @google/generative-ai (fetch) are edge-compatible
export const runtime = 'edge';

export async function POST(request: Request) {
  // Parse body before starting the stream
  const body = await request.json();
  const radiusMiles: number | undefined = body.radiusMiles;
  const query: string | undefined = body.query;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background while streaming keepalive pings
  (async () => {
    const keepalive = setInterval(async () => {
      try {
        await writer.write(encoder.encode('event: ping\ndata: {}\n\n'));
      } catch {
        clearInterval(keepalive);
      }
    }, 5000);

    try {
      await ensureMigrations();

      const brief = await getBrief();
      if (!brief) {
        clearInterval(keepalive);
        await writer.write(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Please complete your advisory brief first.' })}\n\n`)
        );
        await writer.close();
        return;
      }

      const { results, runId } = await runDiscovery(brief, query, radiusMiles);

      clearInterval(keepalive);
      await writer.write(
        encoder.encode(`event: result\ndata: ${JSON.stringify({ results, runId })}\n\n`)
      );
      await writer.close();
    } catch (error) {
      clearInterval(keepalive);
      const message = error instanceof Error ? error.message : 'Discovery failed. Check your Gemini API key.';
      console.error('[discover] Error:', error);
      try {
        await writer.write(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`)
        );
        await writer.close();
      } catch {
        // Writer may already be closed
      }
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
