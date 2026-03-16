import { head } from '@vercel/blob';

export async function GET() {
  try {
    const blob = await head('catalogues/catalogue.pdf');

    return Response.redirect(blob.url, 302);
  } catch (error) {
    return Response.redirect(new URL('/catalogue.pdf', 'https://catalogue-location.vercel.app'), 302);
  }
}
