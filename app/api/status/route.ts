export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    service: 'Duffle Store',
    ready: Boolean(process.env.DUFFLE_API_KEY && process.env.BLOB_READ_WRITE_TOKEN),
    apiKeyConfigured: Boolean(process.env.DUFFLE_API_KEY),
    blobTokenConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    categories: ['movie', 'video', 'music', 'image'],
  });
}
