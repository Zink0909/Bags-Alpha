import { analyzeTokens } from '@/lib/analyze';
import { sendTelegramAlert, formatAlert } from '@/lib/telegram';
import { getSupabase } from '@/lib/supabase';
import { checkCronAuth, unauthorizedResponse } from '@/lib/auth';

const SEEN_BREAKOUTS = new Set<string>();

export async function GET(req: Request) {
  if (!checkCronAuth(req)) return unauthorizedResponse();
  try {
    const tokens = await analyzeTokens(50);
    const breakouts = tokens.filter(t => t.tag === 'Breakout' && t.potentialScore >= 70);
    const newBreakouts = breakouts.filter(t => !SEEN_BREAKOUTS.has(t.mint));

    // 1. Push new Breakouts to all watchlist subscribers
    const supabase = getSupabase();
    for (const token of newBreakouts) {
      SEEN_BREAKOUTS.add(token.mint);

      // Find watchlist entries matching this token's creator
      const creatorUsername = token.creatorTwitter
        ? token.creatorTwitter.replace('https://x.com/', '').split('/')[0]
        : '';

      if (creatorUsername) {
        const { data: watchers } = await supabase
          .from('watchlist')
          .select('telegram_chat_id')
          .eq('creator_username', creatorUsername);

        for (const watcher of watchers || []) {
          await sendTelegramAlert(
            formatAlert(token),
            watcher.telegram_chat_id
          );
        }
      }

      // 2. Also push to default chat ID (global alert)
      await sendTelegramAlert(formatAlert(token));
    }

    return Response.json({
      success: true,
      checked: tokens.length,
      newBreakouts: newBreakouts.length,
      alerted: newBreakouts.map(t => t.symbol),
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}