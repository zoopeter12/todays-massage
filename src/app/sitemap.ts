import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://todaymassage.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nearby`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic shop pages
  try {
    const supabase = createServerClient();
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const shopPages: MetadataRoute.Sitemap = (shops || []).map((shop) => ({
      url: `${baseUrl}/shops/${shop.id}`,
      lastModified: new Date(shop.updated_at || shop.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...shopPages];
  } catch (error) {
    console.error('Failed to fetch shops for sitemap:', error);
    // Gracefully fallback to static pages only
    return staticPages;
  }
}
