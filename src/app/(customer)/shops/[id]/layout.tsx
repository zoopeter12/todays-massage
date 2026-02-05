import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  let shop = null;
  let lowestPrice: number | null = null;

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('shops')
      .select('*, courses(*)')
      .eq('id', id)
      .single();

    shop = data;

    if (shop?.courses && shop.courses.length > 0) {
      const prices = shop.courses.map((c: { price_discount: number | null; price_original: number }) =>
        c.price_discount || c.price_original
      );
      lowestPrice = Math.min(...prices);
    }
  } catch {
    // Return default metadata on error
  }

  if (!shop) {
    return {
      title: '샵을 찾을 수 없습니다',
      description: '요청하신 마사지샵 정보를 찾을 수 없습니다.',
    };
  }

  const title = shop.name;
  const priceText = lowestPrice ? ` | 최저 ${lowestPrice.toLocaleString()}원` : '';
  const categoryText = shop.category ? `[${shop.category}] ` : '';
  const description = `${categoryText}${shop.name}${priceText} - ${shop.address || '오늘의마사지에서 예약하세요'}`;

  return {
    title,
    description,
    keywords: [
      shop.name,
      shop.category || '마사지',
      '마사지 예약',
      shop.address?.split(' ')[0] || '',
      '스파',
      '힐링',
    ].filter(Boolean),
    openGraph: {
      title: `${shop.name} | 오늘의마사지`,
      description,
      type: 'website',
      locale: 'ko_KR',
      siteName: '오늘의마사지',
      images: shop.images?.[0]
        ? [
            {
              url: shop.images[0],
              width: 1200,
              height: 630,
              alt: shop.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${shop.name} | 오늘의마사지`,
      description,
      images: shop.images?.[0] ? [shop.images[0]] : undefined,
    },
  };
}

export default function ShopDetailLayout({ children }: Props) {
  return <>{children}</>;
}
