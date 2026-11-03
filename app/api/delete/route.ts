import { del } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const expected = process.env.DUFFLE_API_KEY;
  const header = request.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!expected || !supplied || supplied !== expected) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Expected JSON containing a blob URL.' }, { status: 400 });
  }

  let blobUrl: URL;
  try {
    blobUrl = new URL(body.url ?? '');
  } catch {
    return Response.json({ error: 'Invalid blob URL.' }, { status: 400 });
  }

  if (blobUrl.protocol !== 'https:' || !blobUrl.hostname.endsWith('.blob.vercel-storage.com')) {
    return Response.json({ error: 'Invalid blob URL.' }, { status: 400 });
  }

  try {
    await del(blobUrl.toString());
    return Response.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete file.';
    return Response.json({ error: message }, { status: 500 });
  }
}
