import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const runtime = 'nodejs';

const categories: Record<string, { folder: string; contentTypes: string[] }> = {
  movie: { folder: 'movies', contentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'] },
  video: { folder: 'videos', contentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'] },
  music: { folder: 'music', contentTypes: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/x-m4a'] },
  image: { folder: 'images', contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] },
};

function authorized(request: Request): boolean {
  const expected = process.env.DUFFLE_API_KEY;
  const header = request.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  return Boolean(expected && supplied && supplied === expected);
}

export async function POST(request: Request, context: { params: Promise<{ type: string }> }) {
  const { type } = await context.params;
  const category = categories[type];

  if (!category) return Response.json({ error: 'Unknown storage category.' }, { status: 404 });

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: 'Expected a JSON upload-token request.' }, { status: 400 });
  }

  const isCompletion = (body as { type?: string }).type === 'blob.upload-completed';
  if (!isCompletion && !authorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const normalized = pathname.replace(/^\/+/, '');
        if (!normalized.startsWith(category.folder + '/') || normalized.includes('..')) {
          throw new Error('Invalid upload path for this category.');
        }

        return {
          allowedContentTypes: category.contentTypes,
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info('Duffle Store upload completed', {
          pathname: blob.pathname,
          contentType: blob.contentType,
          url: blob.url,
        });
      },
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload request failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
