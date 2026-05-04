import { getSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { creatorUsername, telegramChatId } = await req.json();
    if (!creatorUsername || !telegramChatId) {
      return Response.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }
    const supabase = getSupabase();
    const { error } = await supabase.from('watchlist').insert({
      telegram_chat_id: telegramChatId,
      creator_username: creatorUsername,
    });
    if (error && error.code !== '23505') { // ignore duplicate
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { creatorUsername, telegramChatId } = await req.json();
    const supabase = getSupabase();
    await supabase.from('watchlist')
      .delete()
      .eq('telegram_chat_id', telegramChatId)
      .eq('creator_username', creatorUsername);
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramChatId = searchParams.get('chatId');
    if (!telegramChatId) return Response.json({ success: false, error: 'Missing chatId' }, { status: 400 });
    const supabase = getSupabase();
    const { data } = await supabase.from('watchlist')
      .select('creator_username, created_at')
      .eq('telegram_chat_id', telegramChatId)
      .order('created_at', { ascending: false });
    return Response.json({ success: true, data: data || [] });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}