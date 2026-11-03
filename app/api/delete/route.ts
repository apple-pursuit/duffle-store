import { del } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const expected = process.env.DUFFLE_API_KEY;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '');

  if (!expected || !supplied || supplied !== expected) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Expected JSON containing a blob URL.' }, { status: 400 });
  }

  if (!body.url || !/^https:\\/\\/.+\\.blob\\.vercel-storage\\.com\\//.test(body.url)) {
    return Response.json({ error: 'Invalid blob URL.' }, { status: 400 });
  }

  try {
    await del(body.url);
    return Response.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete file.';
    return Response.json({ error: message }, { status: 500 });
  }
}
