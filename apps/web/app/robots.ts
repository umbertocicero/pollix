import type { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

export default function robots(): MetadataRoute.Robots {
  const base = appUrl.replace(/\/$/, '');
  const sitemap = base ? `${base}/sitemap.xml` : '/sitemap.xml';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/dashboard/', '/api/'],
    },
    sitemap,
    host: base || undefined,
  };
}
