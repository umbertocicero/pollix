import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/dashboard/', '/api/'],
    },
    sitemap: 'https://planora-poll.vercel.app/sitemap.xml',
    host: 'https://planora-poll.vercel.app',
  };
}
