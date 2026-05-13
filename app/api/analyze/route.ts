import { analyzeTokens } from '@/lib/analyze';
import { checkCronAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: Request) {
  if (!checkCronAuth(req)) return unauthorizedResponse();
  try {
    const tokens = await analyzeTokens(20);
    return Response.json({ success: true, data: tokens });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
