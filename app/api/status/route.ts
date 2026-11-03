export const runtime = 'nodejs';

function getStatus() {
  const apiKeyConfigured = Boolean(process.env.DUFFLE_API_KEY);
  const blobTokenConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const blobStoreIdConfigured = Boolean(process.env.BLOB_STORE_ID);
  const blobConfigured = blobTokenConfigured || blobStoreIdConfigured;

  return {
    service: 'Duffle Store',
    ready: apiKeyConfigured && blobConfigured,
    apiKeyConfigured,
    blobTokenConfigured,
    blobStoreIdConfigured,
    blobAuthMode: blobTokenConfigured ? 'read-write-token' : blobStoreIdConfigured ? 'oidc' : 'missing',
    categories: ['movie', 'video', 'music', 'image'],
  };
}

export async function GET() {
  return Response.json(getStatus());
}
