import { list } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const runtime = 'nodejs';

const categories: Record<string, { folder: string; contentTypes?: string[]; maximumSizeInBytes: number }> = {
  movie: { folder: 'movies', contentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'], maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024 },
  video: { folder: 'videos', contentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'], maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024 },
  music: { folder: 'music', contentTypes: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/x-m4a'], maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024 },
  image: { folder: 'images', contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'], maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024 },
  Chat_Photo: { folder: 'chat-photos', contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'], maximumSizeInBytes: 20 * 1024 * 1024 },
  Chat_File: { folder: 'chat-files', maximumSizeInBytes: 100 * 1024 * 1024 },
};

function authorized(request: Request): boolean {
  const expected = process.env.DUFFLE_API_KEY;
  const header = request.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  return Boolean(expected && supplied && supplied === expected);
}

async function getStatus() {
  const apiKeyConfigured = Boolean(process.env.DUFFLE_API_KEY);
  const blobTokenConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const blobStoreIdConfigured = Boolean(process.env.BLOB_STORE_ID);
  const blobAuthMode = blobTokenConfigured ? 'read-write-token' : blobStoreIdConfigured ? 'oidc' : 'missing';
  let blobConnectionReady = false;
  if (blobAuthMode !== 'missing') {
    try { await list({ limit: 1 }); blobConnectionReady = true; } catch { blobConnectionReady = false; }
  }
  return {
    service: 'Duffle Store', ready: apiKeyConfigured && blobConnectionReady,
    apiKeyConfigured, blobTokenConfigured, blobStoreIdConfigured, blobAuthMode, blobConnectionReady,
    categories: ['movie', 'video', 'music', 'image', 'Chat_Photo', 'Chat_File'],
  };
}

export async function GET(_request: Request, context: { params: Promise<{ type: string }> }) {
  const { type } = await context.params;
  if (type !== 'status') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  return Response.json(await getStatus());
}

export async function POST(request: Request, context: { params: Promise<{ type: string }> }) {
  const { type } = await context.params;
  const category = categories[type];
  if (!category) return Response.json({ error: 'Unknown storage category.' }, { status: 404 });

  let body: HandleUploadBody;
  try { body = (await request.json()) as HandleUploadBody; }
  catch { return Response.json({ error: 'Expected a JSON upload-token request.' }, { status: 400 }); }

  const isCompletion = (body as { type?: string }).type === 'blob.upload-completed';
  if (!isCompletion && !authorized(request)) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const normalized = pathname.replace(/^\\/+/, '');
        if (!normalized.startsWith(category.folder + '/') || normalized.includes('..')) throw new Error('Invalid upload path for this category.');
        return {
          ...(category.contentTypes ? { allowedContentTypes: category.contentTypes } : {}),
          maximumSizeInBytes: category.maximumSizeInBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ category: type }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info('Duffle Store upload completed', { pathname: blob.pathname, contentType: blob.contentType, url: blob.url });
      },
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload request failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
