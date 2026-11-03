import { list } from '@vercel/blob';

export const runtime = 'nodejs';

async function getStatus() {
  const apiKeyConfigured = Boolean(process.env.DUFFLE_API_KEY);
  const blobTokenConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const blobStoreIdConfigured = Boolean(process.env.BLOB_STORE_ID);
  const blobAuthMode = blobTokenConfigured ? 'read-write-token' : blobStoreIdConfigured ? 'oidc' : 'missing';

  let blobConnectionReady = false;
  if (blobAuthMode !== 'missing') {
    try {
      await list({ limit: 1 });
      blobConnectionReady = true;
    } catch {
      blobConnectionReady = false;
    }
  }

  return {
    service: 'Duffle Store',
    ready: apiKeyConfigured && blobConnectionReady,
    apiKeyConfigured,
    blobTokenConfigured,
    blobStoreIdConfigured,
    blobAuthMode,
    blobConnectionReady,
    categories: ['movie', 'video', 'music', 'image'],
  };
}

export async function GET() {
  return Response.json(await getStatus());
}
