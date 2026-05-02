import type { APIRoute } from 'astro';
import appConfig from '@/config/app.json';

export const GET: APIRoute = () => {
  const manifest = {
    name: appConfig.app.name,
    short_name: appConfig.app.shortName,
    description: appConfig.app.description,
    start_url: '/',
    scope: '/',
    display: appConfig.pwa.display,
    orientation: appConfig.pwa.orientation,
    background_color: appConfig.pwa.backgroundColor,
    theme_color: appConfig.pwa.themeColor,
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
