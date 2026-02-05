import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '오늘의마사지 - 전국 마사지/스파 통합 예약';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
          backgroundImage: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 25%, #fbcfe8 50%, #f9a8d4 75%, #f472b6 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            backgroundColor: 'rgba(236, 72, 153, 0.08)',
          }}
        />

        {/* Logo container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 35,
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 80,
              boxShadow: '0 20px 40px rgba(236, 72, 153, 0.3)',
            }}
          >
            <span style={{ filter: 'brightness(0) invert(1)' }}>&#128134;</span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            backgroundClip: 'text',
            color: '#1f2937',
            marginBottom: 16,
            textAlign: 'center',
            letterSpacing: '-0.03em',
          }}
        >
          오늘의마사지
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 36,
            color: '#4b5563',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          전국 마사지샵, 스파, 태국마사지, 스웨디시를 한곳에서 비교하고 예약하세요
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 48,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '16px 28px',
              borderRadius: 50,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <span style={{ fontSize: 28 }}>&#11088;</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: '#374151' }}>
              실시간 리뷰
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '16px 28px',
              borderRadius: 50,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <span style={{ fontSize: 28 }}>&#128205;</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: '#374151' }}>
              주변 검색
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '16px 28px',
              borderRadius: 50,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <span style={{ fontSize: 28 }}>&#128176;</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: '#374151' }}>
              할인 혜택
            </span>
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 18,
            color: '#9ca3af',
          }}
        >
          <span>todaymassage.com</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
