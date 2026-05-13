export async function GET() {
  return Response.json({ success: false, error: 'Deprecated' }, { status: 410 });
}
