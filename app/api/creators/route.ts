import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().replace(/^@/, '').toLowerCase();
  if (!q || q.length < 2) return Response.json({ suggestions: [] });

  const supabase = getSupabase();
  const { data } = await supabase
    .from('token_snapshots')
    .select('twitter')
    .ilike('twitter', `https://x.com/${q}%`)
    .not('twitter', 'eq', '')
    .limit(100);

  if (!data) return Response.json({ suggestions: [] });

  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const row of data) {
    const match = (row.twitter as string)?.match(/x\.com\/([^/\s]+)/);
    if (match) {
      const username = match[1].toLowerCase();
      if (!seen.has(username)) {
        seen.add(username);
        suggestions.push(username);
      }
    }
  }

  return Response.json({ suggestions: suggestions.slice(0, 8) });
}
