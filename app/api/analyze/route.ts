import { analyzeTokens } from '@/lib/analyze';

export async function GET() {
  try {
    const tokens = await analyzeTokens(20);
    return Response.json({ success: true, data: tokens });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
