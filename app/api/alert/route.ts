import { analyzeTokens } from '@/lib/analyze';
import { sendTelegramAlert, formatAlert } from '@/lib/telegram';

const SEEN_BREAKOUTS = new Set<string>();

export async function GET() {
  try {
    const tokens = await analyzeTokens(30);
    const breakouts = tokens.filter(t => t.tag === 'Breakout' && t.potentialScore >= 70);
    
    const newBreakouts = breakouts.filter(t => !SEEN_BREAKOUTS.has(t.mint));
    
    for (const token of newBreakouts) {
      SEEN_BREAKOUTS.add(token.mint);
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