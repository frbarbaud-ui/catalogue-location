import { handleUpload } from '@vercel/blob/client';

const MAX_SIZE_MB = 30;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const EXPECTED_PATHNAME = 'catalogues/catalogue.pdf';
const CALLBACK_URL = 'https://catalogue-location.vercel.app/api/catalogue-upload';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Méthode non autorisée.' },
      { status: 405 }
    );
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN manquant sur Vercel.');
    }

    if (!process.env.ADMIN_PASSWORD) {
      throw new Error('ADMIN_PASSWORD manquant sur Vercel.');
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
          callbackUrl: CALLBACK_URL,
          tokenPayload: JSON.stringify({
            updatedAt: Date.now()
          })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Catalogue mis à jour :', blob.url);
      }
    });

    return Response.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur inconnue pendant l’upload.';

    let status = 400;

    if (message.includes('Mot de passe incorrect')) status = 401;
    if (message.includes('manquant sur Vercel')) status = 500;
    if (message.includes('Méthode non autorisée')) status = 405;

    return Response.json({ error: message }, { status });
  }
}
