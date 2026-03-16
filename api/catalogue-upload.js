import { handleUpload } from '@vercel/blob/client';

const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const EXPECTED_PATHNAME = 'catalogues/catalogue.pdf';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Méthode non autorisée.' },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!process.env.ADMIN_PASSWORD) {
          throw new Error(
            'Configuration manquante : ADMIN_PASSWORD n’est pas défini sur Vercel.'
          );
        }

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
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log('Catalogue mis à jour :', blob.url);
      }
    });

    return Response.json(jsonResponse, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Erreur inconnue pendant l’upload.';

    let status = 400;

    if (
      message.includes('ADMIN_PASSWORD') ||
      message.includes('Configuration manquante')
    ) {
      status = 500;
    } else if (message.includes('Mot de passe incorrect')) {
      status = 401;
    } else if (message.includes('Méthode non autorisée')) {
      status = 405;
    }

    return Response.json({ error: message }, { status });
  }
}
