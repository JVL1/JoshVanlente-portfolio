import { MetadataRoute } from 'next';
import { baseURL } from '@/app/resources';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    host: `https://${baseURL}`,
    sitemap: `https://${baseURL}/sitemap.xml`,
  };
}