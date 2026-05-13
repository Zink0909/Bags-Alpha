import { analyzeTokens, refreshKnownTokens } from '@/lib/analyze';
import { saveSnapshot } from '@/lib/supabase';
import { checkCronAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request) {
  if (!checkCronAuth(req)) return unauthorizedResponse();
  try {
    // Refresh scores for all known tokens + catch any bags-restream missed via feed
    const [refreshed, feedTokens] = await Promise.allSettled([
      refreshKnownTokens(),
      analyzeTokens(50),
    ]);

    const refreshedData = refreshed.status === 'fulfilled' ? refreshed.value : [];
    const feedData = feedTokens.status === 'fulfilled' ? feedTokens.value : [];

    const knownMints = new Set(refreshedData.map((t: any) => t.mint));
    const newFromFeed = feedData.filter((t: any) => !knownMints.has(t.mint));

    const tokens = [...refreshedData, ...newFromFeed];
    await saveSnapshot(tokens);

    return Response.json({
      success: true,
      refreshed: refreshedData.length,
      newFromFeed: newFromFeed.length,
      saved: tokens.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}