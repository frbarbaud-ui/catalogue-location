import { handleUpload } from '@vercel/blob/client';

const EXPECTED_PATHNAME = 'catalogues/catalogue.pdf';
const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json(
        { error: 'BLOB_READ_WRITE_TOKEN manquant sur Vercel.' },
        { status: 500 }
      );
    }

    if (!process.env.ADMIN_PASSWORD) {
      return Response.json(
        { error: 'ADMIN_PASSWORD manquant sur Vercel.' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};

        try {
          payload = JSON.parse(clientPayload || '{}');
        } catch {
          throw new Error('Données d’authentification invalides.');
        }

        if (!payload.password) {
          throw new Error('Mot de passe manquant.');
        }

        if (payload.password !== process.env.ADMIN_PASSWORD) {
          throw new Error('Mot de passe incorrect.');
        }

        if (pathname !== EXPECTED_PATHNAME) {
          throw new Error('Nom de fichier invalide.');
        }

        return {
          allowedContentTypes: ['application/pdf'],
          addRandomSuffix: false,
          allowOverwrite: true,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          cacheControlMaxAge: 60,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Catalogue mis à jour :', blob.url);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erreur inconnue pendant l’upload.';

    let status = 400;

    if (message.includes('Mot de passe incorrect')) status = 401;
    if (message.includes('manquant sur Vercel')) status = 500;

    return Response.json({ error: message }, { status });
  }
}
