import { sendTelegramAlert, formatAlert } from '@/lib/telegram';
import { getLatestSnapshot, getSupabase } from '@/lib/supabase';
import { checkCronAuth, unauthorizedResponse } from '@/lib/auth';

const ALERT_THRESHOLD = 70;

// Uses "breakout:<mint>" keys in alerted_tokens to persist across cold starts
async function hasBreakoutAlerted(mint: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('alerted_tokens')
    .select('mint')
    .eq('mint', 'breakout:' + mint)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

async function markBreakoutAlerted(mint: string): Promise<void> {
  await getSupabase()
    .from('alerted_tokens')
    .upsert({ mint: 'breakout:' + mint }, { onConflict: 'mint', ignoreDuplicates: true });
}

export async function GET(req: Request) {
  if (!checkCronAuth(req)) return unauthorizedResponse();
  try {
    // Read from Supabase — covers all known tokens, not just recent feed
    const tokens = await getLatestSnapshot();
    const breakouts = tokens.filter(t => t.tag === 'Breakout' && t.potentialScore >= ALERT_THRESHOLD);

    const supabase = getSupabase();
    let alerted = 0;

    for (const token of breakouts) {
      if (await hasBreakoutAlerted(token.mint)) continue;
      await markBreakoutAlerted(token.mint);

      const creatorUsername = token.creatorTwitter
        ? token.creatorTwitter.replace('https://x.com/', '').split('/')[0]
        : '';

      if (creatorUsername) {
        const { data: watchers } = await supabase
          .from('watchlist')
          .select('telegram_chat_id')
          .eq('creator_username', creatorUsername);

        for (const watcher of watchers || []) {
          await sendTelegramAlert(formatAlert(token), watcher.telegram_chat_id);
        }
      }

      await sendTelegramAlert(formatAlert(token));
      alerted++;
    }

    return Response.json({
      success: true,
      checked: breakouts.length,
      alerted,
    });
  } catch (e: any) {
    console.error('alert error:', e);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}