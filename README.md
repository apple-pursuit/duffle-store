# Duffle Store

The remote file-storage API for The Duffle Network. This repository is deployed to Vercel and uses Vercel Blob for file storage.

## API

All management requests require:

`Authorization: Bearer YOUR_DUFFLE_API_KEY`

- `POST /api/movie` — issue a client upload token for a movie.
- `POST /api/video` — issue a client upload token for a video.
- `POST /api/music` — issue a client upload token for music.
- `POST /api/image` — issue a client upload token for an image.
- `GET /api/list?type=movie|video|music|image` — list stored files.
- `POST /api/delete` — delete a stored blob using `{ "url": "..." }`.

The upload endpoints use Vercel Blob client-upload token exchange. They do not accept the movie/music/image bytes as a normal request body. This avoids Vercel Functions' 4.5 MB request-body limit: after receiving a short-lived, restricted upload token from the API, the uploader sends the file directly to Vercel Blob. Large uploads should use the Blob SDK's multipart option.

Upload paths must begin with the matching folder: `movies/`, `videos/`, `music/`, or `images/`. Upload tokens are restricted by category MIME type and a maximum file size of 5 TB. Random suffixes are enabled to avoid filename collisions.

## Vercel setup

1. Import `apple-pursuit/duffle-store` into Vercel.
2. Create a Vercel Blob store for the project and connect it to the deployment.
3. Add the environment variable `DUFFLE_API_KEY` with a long random secret.
4. Confirm `BLOB_READ_WRITE_TOKEN` is present in the deployment environment.
5. Redeploy after setting environment variables.

Keep `DUFFLE_API_KEY` and `BLOB_READ_WRITE_TOKEN` on the Fire tablet's server side only. Never put either secret in browser JavaScript or the public website.

## Important access note

Vercel Blob client uploads are public-file uploads. The resulting blob URLs can be accessed by anyone who has the URL. Do not use this initial API for private backups, private documents, or sensitive personal files. Private file storage needs a separate server-mediated upload and authenticated download design.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add valid values to `.env.local` before testing uploads.
