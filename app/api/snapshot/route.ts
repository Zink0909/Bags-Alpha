import { analyzeTokens, analyzePools } from '@/lib/analyze';
import { saveSnapshot } from '@/lib/supabase';

export async function GET() {
  try {
    const [feedTokens, poolTokens] = await Promise.allSettled([
      analyzeTokens(100),
      analyzePools(50),
    ]);

    const feedData = feedTokens.status === 'fulfilled' ? feedTokens.value : [];
    const poolData = poolTokens.status === 'fulfilled' ? poolTokens.value : [];

    const mintsSeen = new Set(feedData.map((t: any) => t.mint));
    const uniquePoolData = poolData.filter((t: any) => !mintsSeen.has(t.mint));
    const tokens = [...feedData, ...uniquePoolData];

    await saveSnapshot(tokens);

    return Response.json({
      success: true,
      saved: tokens.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}