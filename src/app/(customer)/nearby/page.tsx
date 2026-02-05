'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchNearbyShops, ShopWithDistance } from '@/lib/api/shops';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Map, Loader2, AlertCircle, Navigation } from 'lucide-react';

const RADIUS_KM = 3;

interface UserLocation {
  lat: number;
  lng: number;
}

type LocationState =
  | { status: 'loading' }
  | { status: 'success'; location: UserLocation }
  | { status: 'error'; message: string };

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

function getLowestPrice(shop: ShopWithDistance): number | null {
  if (!shop.courses || shop.courses.length === 0) return null;
  return Math.min(
    ...shop.courses.map((c) => c.price_discount ?? c.price_original)
  );
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

export default function NearbyPage() {
  const router = useRouter();
  const [locationState, setLocationState] = useState<LocationState>({
    status: 'loading',
  });

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('[Nearby] Geolocation API not supported');
      setLocationState({
        status: 'error',
        message: '이 브라우저에서는 위치 서비스를 지원하지 않습니다.',
      });
      return;
    }

    console.log('[Nearby] Requesting user location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[Nearby] ===== LOCATION OBTAINED =====');
        console.log('[Nearby] Latitude:', position.coords.latitude);
        console.log('[Nearby] Longitude:', position.coords.longitude);
        console.log('[Nearby] Accuracy:', position.coords.accuracy, 'meters');
        console.log('[Nearby] Timestamp:', new Date(position.timestamp).toISOString());
        console.log('[Nearby] ==================================');

        setLocationState({
          status: 'success',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        let message = '위치 정보를 가져올 수 없습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.';
            console.error('[Nearby] Location permission denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            message = '위치 정보를 사용할 수 없습니다.';
            console.error('[Nearby] Location position unavailable');
            break;
          case error.TIMEOUT:
            message = '위치 요청 시간이 초과되었습니다.';
            console.error('[Nearby] Location request timeout');
            break;
        }
        console.error('[Nearby] Geolocation error:', error);
        setLocationState({ status: 'error', message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Fetch nearby shops when location is available
  const userLocation =
    locationState.status === 'success' ? locationState.location : null;

  // Log when userLocation changes
  useEffect(() => {
    if (userLocation) {
      console.log('[Nearby] ===== USER LOCATION STATE UPDATED =====');
      console.log('[Nearby] User Location:', userLocation);
      console.log('[Nearby] Search radius:', RADIUS_KM, 'km');
      console.log('[Nearby] Will call API: /api/shops/nearby');
      console.log('[Nearby] ==========================================');
    }
  }, [userLocation]);

  const {
    data: shops = [],
    isLoading: isShopsLoading,
    error: shopsError,
  } = useQuery({
    queryKey: ['shops', 'nearby', userLocation?.lat, userLocation?.lng, RADIUS_KM],
    queryFn: async () => {
      console.log('[Nearby] ===== FETCHING NEARBY SHOPS =====');
      console.log('[Nearby] Request params:', {
        lat: userLocation!.lat,
        lng: userLocation!.lng,
        radius: RADIUS_KM,
      });

      const result = await fetchNearbyShops(userLocation!.lat, userLocation!.lng, RADIUS_KM);

      console.log('[Nearby] ===== API RESPONSE RECEIVED =====');
      console.log('[Nearby] Total shops found:', result.length);

      if (result.length > 0) {
        console.log('[Nearby] Shop details:');
        result.forEach((shop, index) => {
          console.log(`[Nearby] #${index + 1}:`, {
            id: shop.id,
            name: shop.name,
            distance: `${shop.distance.toFixed(2)}km`,
            address: shop.address,
            location: {
              lat: shop.lat,
              lng: shop.lng,
            },
          });
        });

        console.log('[Nearby] Closest shop:', {
          name: result[0].name,
          distance: `${result[0].distance.toFixed(2)}km`,
        });
        console.log('[Nearby] Farthest shop:', {
          name: result[result.length - 1].name,
          distance: `${result[result.length - 1].distance.toFixed(2)}km`,
        });
      } else {
        console.log('[Nearby] No shops found within radius');
      }
      console.log('[Nearby] =====================================');

      return result;
    },
    enabled: !!userLocation,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleMapView = () => {
    if (userLocation) {
      router.push(`/search?lat=${userLocation.lat}&lng=${userLocation.lng}&from=nearby`);
    } else {
      router.push('/search');
    }
  };

  const handleShopClick = (shopId: string) => {
    router.push(`/shops/${shopId}`);
  };

  // Loading state: getting location
  if (locationState.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground text-center">
          현재 위치를 확인하고 있습니다...
        </p>
      </div>
    );
  }

  // Error state: location permission denied or unavailable
  if (locationState.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">위치 정보 필요</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            {locationState.message}
          </p>
        </div>
        <Button variant="outline" onClick={handleMapView} className="mt-4">
          <Map className="w-4 h-4 mr-2" />
          지도로 검색하기
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            <h1 className="text-lg font-bold">내 주변</h1>
            <span className="text-xs text-muted-foreground">
              반경 {RADIUS_KM}km
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMapView}
            className="gap-1.5"
          >
            <Map className="w-4 h-4" />
            지도로 보기
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {/* Loading shops */}
        {isShopsLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              주변 매장을 검색 중입니다...
            </p>
          </div>
        )}

        {/* Error fetching shops */}
        {shopsError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              매장 정보를 불러오는데 실패했습니다.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isShopsLoading && !shopsError && shops.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">주변에 매장이 없습니다</p>
              <p className="text-xs text-muted-foreground">
                반경 {RADIUS_KM}km 내에 등록된 매장이 없습니다.
              </p>
            </div>
            <Button variant="outline" onClick={handleMapView} className="mt-2">
              <Map className="w-4 h-4 mr-2" />
              지도에서 찾기
            </Button>
          </div>
        )}

        {/* Shop list */}
        {!isShopsLoading &&
          shops.map((shop) => {
            const lowestPrice = getLowestPrice(shop);
            const thumbnailUrl =
              shop.images && shop.images.length > 0 ? shop.images[0] : null;

            return (
              <Card
                key={shop.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleShopClick(shop.id)}
                role="button"
                tabIndex={0}
                aria-label={`${shop.name} - ${formatDistance(shop.distance)}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleShopClick(shop.id);
                  }
                }}
              >
                <div className="flex gap-3 p-3">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={shop.name}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <MapPin className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {shop.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 text-xs px-1.5 py-0.5"
                        >
                          {formatDistance(shop.distance)}
                        </Badge>
                      </div>
                      {shop.address && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {shop.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      {shop.category && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {shop.category}
                        </Badge>
                      )}
                      {lowestPrice !== null && (
                        <span className="text-xs font-medium text-primary">
                          {formatPrice(lowestPrice)}~
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

        {/* Result count */}
        {!isShopsLoading && shops.length > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
            반경 {RADIUS_KM}km 내 {shops.length}개 매장
          </p>
        )}
      </div>
    </div>
  );
}
