import { handleUpload } from '@vercel/blob/client';

export default async function handler(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}');

        if (!process.env.ADMIN_PASSWORD) {
          throw new Error('ADMIN_PASSWORD n’est pas configuré sur Vercel.');
        }

        if (payload.password !== process.env.ADMIN_PASSWORD) {
          throw new Error('Mot de passe incorrect.');
        }

        if (pathname !== 'catalogues/catalogue.pdf') {
          throw new Error('Chemin de fichier invalide.');
        }

        return {
          allowedContentTypes: ['application/pdf'],
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60,
          maximumSizeInBytes: 30 * 1024 * 1024
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Catalogue uploadé :', blob.url);
      }
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: error.message || 'Erreur upload.' },
      { status: 400 }
    );
  }
}
