import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker.co.ke'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE_URL}/demo`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/login`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE_URL}/privacy`,lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
