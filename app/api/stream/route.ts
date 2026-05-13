import { getLatestSnapshot, getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getLatestCapturedAt(): Promise<string | null> {
  const { data } = await getSupabase()
    .from('token_snapshots')
    .select('captured_at')
    .order('captured_at', { ascending: false })
    .limit(1);
  return data?.[0]?.captured_at ?? null;
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (data: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial data immediately
      let lastCapturedAt: string | null = null;
      try {
        const tokens = await getLatestSnapshot();
        send({ type: 'tokens', data: tokens });
        lastCapturedAt = await getLatestCapturedAt();
      } catch {
        send({ type: 'error', message: 'Failed to load' });
      }

      // Poll for new snapshots every 30 seconds and push if data changed
      const poll = setInterval(async () => {
        if (closed) { clearInterval(poll); return; }
        try {
          const latest = await getLatestCapturedAt();
          if (latest && latest !== lastCapturedAt) {
            lastCapturedAt = latest;
            const tokens = await getLatestSnapshot();
            send({ type: 'tokens', data: tokens });
          } else {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          }
        } catch {
          if (!closed) controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }
      }, 30000);

      // Close after 5 minutes to avoid resource leak on Vercel
      setTimeout(() => {
        closed = true;
        clearInterval(poll);
        try { controller.close(); } catch {}
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}