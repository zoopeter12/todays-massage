import { ImageResponse } from 'next/og';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const alt = '오늘의마사지 - 샵 상세';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;

  // Fetch shop data
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

    // Calculate lowest price from courses
    if (shop?.courses && shop.courses.length > 0) {
      const prices = shop.courses.map((c: { price_discount: number | null; price_original: number }) =>
        c.price_discount || c.price_original
      );
      lowestPrice = Math.min(...prices);
    }
  } catch {
    // Continue with fallback
  }

  // Fallback if shop not found
  if (!shop) {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#1f2937',
              marginBottom: 20,
            }}
          >
            오늘의마사지
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#6b7280',
            }}
          >
            샵 정보를 찾을 수 없습니다
          </div>
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#fff',
          position: 'relative',
        }}
      >
        {/* Left side - Shop image or gradient */}
        <div
          style={{
            width: '45%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: shop.images?.[0]
              ? 'transparent'
              : 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
          }}
        >
          {shop.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.images[0]}
              alt={shop.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 30,
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
              }}
            >
              <span style={{ filter: 'brightness(0) invert(1)' }}>&#128134;</span>
            </div>
          )}
          {/* Gradient overlay on image */}
          {shop.images?.[0] && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(to right, transparent, white)',
              }}
            />
          )}
        </div>

        {/* Right side - Shop info */}
        <div
          style={{
            width: '55%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px',
            paddingLeft: '40px',
          }}
        >
          {/* Category badge */}
          {shop.category && (
            <div
              style={{
                display: 'flex',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  backgroundColor: '#fce7f3',
                  color: '#db2777',
                  padding: '8px 20px',
                  borderRadius: 20,
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {shop.category}
              </div>
            </div>
          )}

          {/* Shop name */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#1f2937',
              marginBottom: 20,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {shop.name.length > 15 ? `${shop.name.slice(0, 15)}...` : shop.name}
          </div>

          {/* Address */}
          {shop.address && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 24 }}>&#128205;</span>
              <span
                style={{
                  fontSize: 24,
                  color: '#6b7280',
                }}
              >
                {shop.address.length > 30 ? `${shop.address.slice(0, 30)}...` : shop.address}
              </span>
            </div>
          )}

          {/* Price info */}
          {lowestPrice && (
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginTop: 20,
              }}
            >
              <span style={{ fontSize: 24, color: '#9ca3af' }}>최저</span>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 700,
                  color: '#ec4899',
                }}
              >
                {lowestPrice.toLocaleString()}원
              </span>
            </div>
          )}

          {/* View count */}
          {shop.view_count > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                color: '#9ca3af',
                fontSize: 20,
              }}
            >
              <span>&#128065;</span>
              <span>조회 {shop.view_count.toLocaleString()}회</span>
            </div>
          )}

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              marginTop: 32,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
                padding: '18px 36px',
                borderRadius: 12,
                fontSize: 24,
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)',
              }}
            >
              지금 예약하기
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            <span style={{ filter: 'brightness(0) invert(1)' }}>&#128134;</span>
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#6b7280',
            }}
          >
            오늘의마사지
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
