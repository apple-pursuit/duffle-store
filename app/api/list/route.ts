import { list } from '@vercel/blob';

export const runtime = 'nodejs';

const folders: Record<string, string> = {
  movie: 'movies/',
  video: 'videos/',
  music: 'music/',
  image: 'images/',
};

export async function GET(request: Request) {
  const expected = (process.env.DUFFLE_API_KEY ?? '').trim();
  const header = request.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!expected || !supplied || supplied !== expected) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const prefix = folders[url.searchParams.get('type') ?? ''];

  if (!prefix) return Response.json({ error: 'Unknown storage category.' }, { status: 400 });

  try {
    const result = await list({ prefix, limit: 1000 });
    return Response.json({ blobs: result.blobs, hasMore: result.hasMore, cursor: result.cursor });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not list files.';
    return Response.json({ error: message }, { status: 500 });
  }
}
