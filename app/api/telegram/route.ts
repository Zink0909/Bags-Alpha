import { getSupabase } from '@/lib/supabase';
import { sendTelegramAlert } from '@/lib/telegram';
import { getLatestSnapshot } from '@/lib/supabase';
import { unauthorizedResponse } from '@/lib/auth';

async function sendMessage(chatId: string, text: string) {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const message = body?.message;
    if (!message || !message.text) return Response.json({ ok: true });

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    const supabase = getSupabase();

    if (command === '/start' || command === '/help') {
      await sendMessage(chatId, [
        '<b>Bags Alpha Bot</b>',
        '',
        'Commands:',
        '/top — Show current Breakout tokens',
        '/watch [creator] — Watch a creator',
        '/list — Your watchlist',
        '/remove [creator] — Remove from watchlist',
        '',
        'Example: <code>/watch wolflovesmelon</code>',
      ].join('\n'));

    } else if (command === '/top') {
      const tokens = await getLatestSnapshot();
      const breakouts = tokens.filter(t => t.tag === 'Breakout').slice(0, 5);
      if (breakouts.length === 0) {
        await sendMessage(chatId, 'No Breakout tokens right now. Check back later.');
      } else {
        const lines = ['<b>Top Breakout Tokens</b>', ''];
        for (const t of breakouts) {
          lines.push(`▲ <b>${t.symbol}</b> — Score ${t.potentialScore}`);
          lines.push(`<a href="https://bags-alpha-pied.vercel.app/token/${t.mint}">View on Bags Alpha</a>`);
          lines.push('');
        }
        await sendMessage(chatId, lines.join('\n'));
      }

    } else if (command === '/watch') {
      if (!arg) {
        await sendMessage(chatId, 'Usage: /watch [creator_username]\nExample: /watch wolflovesmelon');
      } else {
        const creator = arg.replace('@', '').toLowerCase();
        const { error } = await supabase.from('watchlist').insert({
          telegram_chat_id: chatId,
          creator_username: creator,
        });
        if (error && error.code !== '23505') {
          await sendMessage(chatId, 'Something went wrong. Try again.');
        } else if (error?.code === '23505') {
          await sendMessage(chatId, `You're already watching @${creator}.`);
        } else {
          await sendMessage(chatId, `Watching <b>@${creator}</b>. You'll get alerts when their tokens show signal.`);
        }
      }

    } else if (command === '/list') {
      const { data } = await supabase.from('watchlist')
        .select('creator_username, created_at')
        .eq('telegram_chat_id', chatId)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        await sendMessage(chatId, 'Your watchlist is empty.\nUse /watch [creator] to add someone.');
      } else {
        const lines = [`<b>Your Watchlist (${data.length})</b>`, ''];
        for (const w of data) {
          lines.push(`· @${w.creator_username}`);
        }
        await sendMessage(chatId, lines.join('\n'));
      }

    } else if (command === '/remove') {
      if (!arg) {
        await sendMessage(chatId, 'Usage: /remove [creator_username]');
      } else {
        const creator = arg.replace('@', '').toLowerCase();
        await supabase.from('watchlist')
          .delete()
          .eq('telegram_chat_id', chatId)
          .eq('creator_username', creator);
        await sendMessage(chatId, `Removed <b>@${creator}</b> from your watchlist.`);
      }

    } else {
      await sendMessage(chatId, 'Unknown command. Send /help to see available commands.');
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error('Telegram webhook error:', e);
    return Response.json({ ok: true });
  }
}