export function checkCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export function unauthorizedResponse() {
  return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
