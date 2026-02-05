'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapBounds, fetchShopsByBounds, fetchShopsByCategory } from '@/lib/api/shops';
import { ShopWithCourses } from '@/types/supabase';
import { MapSearchDrawer } from '@/components/customer/MapSearchDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Crosshair,
  Loader2,
  Map,
  List,
  X,
  MapPin,
  Clock,
  ChevronRight,
  Star,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { PriceDisplay } from '@/components/customer/PriceDisplay';

// Default center: Seoul City Hall
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };
const DEFAULT_ZOOM = 15;

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category');

  // Read URL parameters for location (from nearby page)
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const fromPage = searchParams.get('from');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const userMarkerRef = useRef<naver.maps.Marker | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  // When category is present, start in list mode; otherwise map mode
  const [viewMode, setViewMode] = useState<'list' | 'map'>(category ? 'list' : 'map');

  // Update view mode when category changes
  useEffect(() => {
    if (category) {
      setViewMode('list');
    } else {
      setViewMode('map');
    }
  }, [category]);

  // 지도 로드 에러 시 자동으로 목록 모드로 전환
  useEffect(() => {
    if (mapLoadError && viewMode === 'map') {
      // 2초 후 자동으로 목록 모드로 전환
      const timer = setTimeout(() => {
        setViewMode('list');
        toast.info('지도를 사용할 수 없어 목록으로 전환합니다', {
          description: '매장 목록에서 원하는 매장을 찾아보세요.',
          duration: 3000,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mapLoadError, viewMode]);

  // Initialize Naver Map (only when in map mode)
  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!mapRef.current) return;

    const initMap = () => {
      console.log('[NaverMap] initMap() called');
      console.log('[NaverMap] window.naver exists:', !!window.naver);
      console.log('[NaverMap] window.naver.maps exists:', !!window.naver?.maps);
      console.log('[NaverMap] mapRef.current exists:', !!mapRef.current);

      if (!window.naver?.maps || !mapRef.current) {
        console.error('[NaverMap] Initialization blocked - missing requirements');
        return;
      }

      // 인증 실패 플래그 체크 (layout.tsx의 navermap_authFailure에서 설정)
      if ((window as any).__NAVER_MAP_AUTH_FAILED__) {
        console.error('[NaverMap] Authentication failed - skipping map initialization');
        setMapLoadError(true);
        return;
      }

      // naver.maps.LatLng null 체크 (인증 실패 시 내부 객체가 null일 수 있음)
      if (!naver.maps.LatLng) {
        console.error('[NaverMap] naver.maps.LatLng is null - API may not be properly authenticated');
        setMapLoadError(true);
        return;
      }

      // If map already exists, just trigger bounds update
      if (mapInstanceRef.current) {
        console.log('[NaverMap] Map instance already exists, updating bounds');

        // 인증 실패 시 bounds 업데이트 중단
        if ((window as any).__NAVER_MAP_AUTH_FAILED__) {
          console.error('[NaverMap] Skipping bounds update due to auth failure');
          setMapLoadError(true);
          return;
        }

        setMapReady(true);
        try {
          const mapBounds = mapInstanceRef.current.getBounds() as naver.maps.LatLngBounds;
          if (mapBounds && mapBounds.getSW && mapBounds.getNE) {
            const sw = mapBounds.getSW();
            const ne = mapBounds.getNE();
            setBounds({
              swLat: sw.lat(),
              swLng: sw.lng(),
              neLat: ne.lat(),
              neLng: ne.lng(),
            });
          }
        } catch (e) {
          console.error('[NaverMap] Error updating bounds:', e);
        }
        return;
      }

      console.log('[NaverMap] Creating new map instance...');
      console.log('[NaverMap] Map container dimensions:', {
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
      });

      // Determine initial center from URL params or default
      let initialCenter = DEFAULT_CENTER;
      if (urlLat && urlLng) {
        const lat = parseFloat(urlLat);
        const lng = parseFloat(urlLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          initialCenter = { lat, lng };
          console.log('[NaverMap] Using URL parameters for initial center:', initialCenter);
        }
      }

      try {
        const mapOptions: naver.maps.MapOptions = {
          center: new naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_LEFT,
          },
        };

        console.log('[NaverMap] Calling new naver.maps.Map()...');
        const map = new naver.maps.Map(mapRef.current, mapOptions);
        console.log('[NaverMap] Map instance created successfully');

        mapInstanceRef.current = map;
        setMapReady(true);
        console.log('[NaverMap] Map initialization complete');

        // 인증 실패 감지 리스너 (지도 생성 후 인증 실패가 발생할 수 있음)
        const authCheckInterval = setInterval(() => {
          if ((window as any).__NAVER_MAP_AUTH_FAILED__) {
            console.error('[NaverMap] Authentication failure detected after map creation');
            clearInterval(authCheckInterval);
            setMapLoadError(true);
            setMapReady(false);
          }
        }, 500);

        // 5초 후 체크 중단 (인증 성공으로 간주)
        setTimeout(() => {
          clearInterval(authCheckInterval);
        }, 5000);

        // Update bounds on map idle (after drag/zoom)
        naver.maps.Event.addListener(map, 'idle', () => {
          // 인증 실패 시 bounds 업데이트 중단
          if ((window as any).__NAVER_MAP_AUTH_FAILED__) {
            return;
          }
          try {
            const mapBounds = map.getBounds() as naver.maps.LatLngBounds;
            if (mapBounds && mapBounds.getSW && mapBounds.getNE) {
              const sw = mapBounds.getSW();
              const ne = mapBounds.getNE();
              setBounds({
                swLat: sw.lat(),
                swLng: sw.lng(),
                neLat: ne.lat(),
                neLng: ne.lng(),
              });
            }
          } catch (e) {
            console.error('[NaverMap] Error in idle event:', e);
          }
        });

      // Get user location on mount (only if no URL params provided)
      if (urlLat && urlLng) {
        // URL params provided - use them as initial location
        const lat = parseFloat(urlLat);
        const lng = parseFloat(urlLng);
        if (!isNaN(lat) && !isNaN(lng) && naver.maps.LatLng) {
          const urlPos = new naver.maps.LatLng(lat, lng);
          addUserMarker(map, urlPos);
          setUsingDefaultLocation(false);
          console.log('[NaverMap] Using URL params, skipping geolocation');
        }
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // 인증 실패 체크
            if ((window as any).__NAVER_MAP_AUTH_FAILED__ || !naver.maps.LatLng) {
              console.error('[NaverMap] Skipping geolocation marker due to auth failure');
              return;
            }
            const userPos = new naver.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );
            map.setCenter(userPos);
            addUserMarker(map, userPos);
            setUsingDefaultLocation(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setUsingDefaultLocation(true);

            // Provide user feedback based on error type
            let errorMessage = '위치 정보를 가져올 수 없습니다';
            let errorDescription = '서울시청 기준으로 매장을 표시합니다.';

            if (error.code === error.PERMISSION_DENIED) {
              errorDescription = '위치 권한이 거부되었습니다. 서울시청 기준으로 매장을 표시합니다.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorDescription = '위치를 확인할 수 없습니다. 서울시청 기준으로 매장을 표시합니다.';
            } else if (error.code === error.TIMEOUT) {
              errorDescription = '위치 확인 시간이 초과되었습니다. 서울시청 기준으로 매장을 표시합니다.';
            }

            toast.info(errorMessage, {
              description: errorDescription,
              duration: 4000,
            });
          }
        );
      } else {
        // Geolocation not supported
        setUsingDefaultLocation(true);
        toast.info('위치 서비스를 사용할 수 없습니다', {
          description: '서울시청 기준으로 매장을 표시합니다.',
          duration: 4000,
        });
      }
      } catch (error: any) {
        console.error('[NaverMap] Map creation failed');
        console.error('[NaverMap] Error type:', error?.name);
        console.error('[NaverMap] Error message:', error?.message);
        console.error('[NaverMap] Error stack:', error?.stack);

        // Check for common error patterns
        const errorMsg = error?.message || '';
        if (errorMsg.includes('authentication') || errorMsg.includes('auth') || errorMsg.includes('credential')) {
          console.error('[NaverMap] AUTHENTICATION ERROR detected');
          console.error('[NaverMap] Possible causes:');
          console.error('[NaverMap]  - Invalid API key (client ID)');
          console.error('[NaverMap]  - Expired API key');
          console.error('[NaverMap]  - Domain not registered in Naver Cloud Console');
          console.error('[NaverMap]  - API key not matching the registered domain');
        } else if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
          console.error('[NaverMap] PERMISSION ERROR detected');
          console.error('[NaverMap] Check API key permissions in Naver Cloud Console');
        } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
          console.error('[NaverMap] QUOTA/LIMIT ERROR detected');
          console.error('[NaverMap] API usage limit may have been exceeded');
        } else {
          console.error('[NaverMap] UNKNOWN ERROR - check error details above');
        }

        setMapLoadError(true);
        return;
      }
    };

    // Check if naver maps is already loaded
    if (window.naver?.maps) {
      console.log('[NaverMap] SDK already available, initializing map');
      initMap();
    } else {
      // Wait for script to load with timeout (10 seconds)
      let attempts = 0;
      const maxAttempts = 100; // 100ms * 100 = 10초

      console.log('[NaverMap] Waiting for SDK to load...');
      console.log('[NaverMap] API Key present:', !!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID);

      const checkInterval = setInterval(() => {
        attempts++;

        // Log detailed SDK loading state every 2 seconds
        if (attempts % 20 === 0) {
          console.log(`[NaverMap] Still waiting for SDK... (${attempts * 100}ms elapsed)`);
          console.log('[NaverMap] window.naver exists:', !!window.naver);
          if (window.naver) {
            console.log('[NaverMap] window.naver.maps exists:', !!window.naver.maps);
            console.log('[NaverMap] window.naver properties:', Object.keys(window.naver));
          }
        }

        if (window.naver?.maps) {
          clearInterval(checkInterval);
          console.log('[NaverMap] SDK loaded after', attempts * 100, 'ms');
          console.log('[NaverMap] Available naver.maps properties:', Object.keys(window.naver.maps).slice(0, 10));
          initMap();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setMapLoadError(true);
          console.error('[NaverMap] SDK 로딩 타임아웃 (10초 초과)');
          console.error('[NaverMap] Final state check:');
          console.error('[NaverMap]  - window.naver exists:', !!window.naver);
          console.error('[NaverMap]  - window.naver type:', typeof window.naver);
          if (window.naver) {
            console.error('[NaverMap]  - window.naver.maps exists:', !!window.naver.maps);
            console.error('[NaverMap]  - window.naver properties:', Object.keys(window.naver));
          }
          console.error('[NaverMap] Possible causes:');
          console.error('[NaverMap]  1. Network issue - script failed to load');
          console.error('[NaverMap]  2. Invalid API key (client ID)');
          console.error('[NaverMap]  3. Domain not registered in Naver Cloud Console');
          console.error('[NaverMap]  4. API key restrictions (referrer, IP)');
          console.error('[NaverMap]  5. Browser blocking the script (CORS, CSP)');

          // Check if script tag exists in DOM
          const scriptTags = document.querySelectorAll('script[src*="naver"]');
          console.error('[NaverMap] Naver script tags found:', scriptTags.length);
          scriptTags.forEach((script, index) => {
            console.error(`[NaverMap] Script ${index + 1}:`, (script as HTMLScriptElement).src);
          });
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [viewMode, urlLat, urlLng]);

  // Add user location marker (blue dot)
  const addUserMarker = (map: naver.maps.Map, position: naver.maps.LatLng) => {
    // 인증 실패 시 마커 생성 중단
    if ((window as any).__NAVER_MAP_AUTH_FAILED__ || !naver.maps.Marker || !naver.maps.Point) {
      console.error('[NaverMap] Cannot create user marker - API not properly authenticated');
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(position);
      return;
    }
    userMarkerRef.current = new naver.maps.Marker({
      position,
      map,
      icon: {
        content: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        anchor: new naver.maps.Point(10, 10),
      },
    });
  };

  // Fetch shops by category (list mode)
  const {
    data: categoryShops = [],
    isLoading: categoryLoading,
  } = useQuery({
    queryKey: ['shops', 'category', category],
    queryFn: () => fetchShopsByCategory(category!),
    enabled: !!category,
    staleTime: 1000 * 10, // 10 seconds - reduced from 60s to get fresher data
  });

  // Fetch shops within bounds (map mode), also apply category filter if present
  const { data: mapShops = [], isLoading: mapLoading } = useQuery({
    queryKey: ['shops', 'map', bounds, category],
    queryFn: () => fetchShopsByBounds(bounds!, category || undefined),
    enabled: !!bounds && viewMode === 'map',
    staleTime: 1000 * 10, // 10 seconds - reduced from 60s to get fresher data
  });

  // Determine which shops to display based on view mode
  const shops = viewMode === 'list' ? categoryShops : mapShops;
  const isLoading = viewMode === 'list' ? categoryLoading : mapLoading;

  // Update shop markers when shops change (map mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || viewMode !== 'map') return;

    // 인증 실패 시 마커 생성 중단
    if ((window as any).__NAVER_MAP_AUTH_FAILED__ || !naver.maps.LatLng) {
      console.error('[NaverMap] Skipping marker creation due to auth failure');
      return;
    }

    // Clear old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers with labels
    mapShops.forEach((shop) => {
      if (!shop.lat || !shop.lng) return;

      // 마커 생성 전 LatLng null 체크
      if (!naver.maps.LatLng) {
        console.error('[NaverMap] naver.maps.LatLng is null, cannot create marker');
        return;
      }

      const position = new naver.maps.LatLng(shop.lat, shop.lng);
      const isSelected = selectedShopId === shop.id;

      // Calculate lowest price from courses
      let lowestPrice: number | null = null;
      if (shop.courses && shop.courses.length > 0) {
        lowestPrice = shop.courses.reduce((min, course) => {
          const price = course.price_discount || course.price_original;
          return price < min ? price : min;
        }, shop.courses[0].price_discount || shop.courses[0].price_original);
      }

      // Format price with thousand separators
      const formattedPrice = lowestPrice
        ? new Intl.NumberFormat('ko-KR').format(lowestPrice) + '원'
        : null;

      // Create marker with label only (no pin)
      const marker = new naver.maps.Marker({
        position,
        map,
        title: shop.name,
        icon: {
          content: `
            <div class="marker-container" style="cursor:pointer;position:relative;">
              ${formattedPrice ? `
              <!-- 최저 금액 라벨 -->
              <div class="marker-label" style="
                white-space:nowrap;
                z-index:${isSelected ? 1001 : 101};
                transition:transform 0.2s ease;
              ">
                <div style="
                  background:white;
                  padding:8px 14px;
                  border-radius:10px;
                  box-shadow:0 3px 12px rgba(0,0,0,0.2);
                  font-size:13px;
                  font-weight:700;
                  color:#1f2937;
                  border:2px solid ${isSelected ? '#ec4899' : '#e5e7eb'};
                  position:relative;
                ">
                  ${formattedPrice}
                  <div style="
                    position:absolute;
                    bottom:-7px;
                    left:50%;
                    transform:translateX(-50%);
                    width:0;
                    height:0;
                    border-left:7px solid transparent;
                    border-right:7px solid transparent;
                    border-top:7px solid ${isSelected ? '#ec4899' : 'white'};
                    filter:drop-shadow(0 1px 2px rgba(0,0,0,0.15));
                  "></div>
                </div>
              </div>
              ` : `
              <!-- 코스 없는 샵 - 작은 점 -->
              <div style="
                width:10px;
                height:10px;
                border-radius:50%;
                background:#ec4899;
                border:2px solid white;
                box-shadow:0 2px 6px rgba(0,0,0,0.25);
              "></div>
              `}
            </div>
          `,
          anchor: formattedPrice
            ? new naver.maps.Point(0, 7)  // 라벨 있을 때: 화살표 끝 부분이 위치 포인트
            : new naver.maps.Point(5, 5), // 라벨 없을 때: 점의 중심
        },
      });

      // Set zIndex via type assertion (Naver Maps API supports this but types may not include it)
      (marker as any).setZIndex?.(isSelected ? 1000 : 100);

      // Click event - navigate to shop detail page
      naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedShopId(shop.id);
        router.push(`/shops/${shop.id}`);
      });

      // Hover effect
      naver.maps.Event.addListener(marker, 'mouseover', () => {
        const markerEl = (marker as any).getElement?.();
        if (markerEl) {
          const label = markerEl.querySelector('.marker-label') as HTMLElement;
          if (label) {
            label.style.transform = 'scale(1.1)';
          }
        }
      });

      naver.maps.Event.addListener(marker, 'mouseout', () => {
        const markerEl = (marker as any).getElement?.();
        if (markerEl) {
          const label = markerEl.querySelector('.marker-label') as HTMLElement;
          if (label) {
            label.style.transform = 'scale(1)';
          }
        }
      });

      markersRef.current.push(marker);
    });
  }, [mapShops, mapReady, viewMode, selectedShopId, router]);

  // Move to user location
  const handleMoveToUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('위치 서비스를 사용할 수 없습니다', {
        description: '브라우저에서 위치 서비스를 지원하지 않습니다.',
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const map = mapInstanceRef.current;
        if (map) {
          // 인증 실패 체크
          if ((window as any).__NAVER_MAP_AUTH_FAILED__ || !naver.maps.LatLng) {
            toast.error('지도 서비스 오류', {
              description: '네이버 지도 인증에 실패했습니다.',
            });
            setIsGettingLocation(false);
            return;
          }
          const userPos = new naver.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );
          map.setCenter(userPos);
          addUserMarker(map, userPos);
          setUsingDefaultLocation(false);
          toast.success('현재 위치로 이동했습니다');
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);

        let errorMessage = '위치 정보를 가져올 수 없습니다';
        let errorDescription = '브라우저의 위치 권한을 확인해주세요.';

        if (error.code === error.PERMISSION_DENIED) {
          errorDescription = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorDescription = '위치를 확인할 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.';
        } else if (error.code === error.TIMEOUT) {
          errorDescription = '위치 확인 시간이 초과되었습니다. 다시 시도해주세요.';
        }

        toast.error(errorMessage, {
          description: errorDescription,
          duration: 5000,
        });
      }
    );
  };

  // Clear category filter
  const handleClearCategory = () => {
    router.push('/search');
  };

  // Toggle between list and map view
  const handleToggleView = () => {
    setViewMode((prev) => (prev === 'list' ? 'map' : 'list'));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  };

  // -- LIST VIEW --
  if (viewMode === 'list') {
    return (
      <div className="min-h-[calc(100vh-7rem)] bg-background">
        {/* Header with category badge and view toggle */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {category && (
                <Badge
                  variant="secondary"
                  className="text-sm px-3 py-1 flex items-center gap-1"
                >
                  {category}
                  <button
                    onClick={handleClearCategory}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    aria-label="카테고리 필터 해제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {isLoading ? '검색 중...' : `${shops.length}개 매장`}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleView}
              className="flex items-center gap-1.5"
            >
              <Map className="w-4 h-4" />
              지도로 보기
            </Button>
          </div>
        </div>

        {/* Shop list */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <CategoryShopListSkeleton />
          ) : shops.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">매장을 찾을 수 없습니다.</p>
              <p className="text-sm mt-1">다른 카테고리를 선택해보세요.</p>
            </div>
          ) : (
            shops.map((shop, index) => {
              const lowestPriceCourse =
                shop.courses && shop.courses.length > 0
                  ? shop.courses.reduce((min, course) =>
                      (course.price_discount || course.price_original) <
                      (min.price_discount || min.price_original)
                        ? course
                        : min,
                    shop.courses[0])
                  : null;

              return (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/shops/${shop.id}`}>
                    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm">
                      <CardContent className="p-0">
                        <div className="flex gap-3 p-3">
                          {/* Shop Image */}
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            {shop.images && shop.images.length > 0 ? (
                              <Image
                                src={shop.images[0]}
                                alt={shop.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Shop Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-sm line-clamp-1">
                                  {shop.name}
                                </h3>
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              </div>

                              {shop.address && (
                                <div className="flex items-start gap-1 mb-1">
                                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {shop.address}
                                  </p>
                                </div>
                              )}

                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium text-slate-600">
                                  {shop.view_count.toLocaleString()} views
                                </span>
                              </div>
                            </div>

                            {/* Lowest Price Course */}
                            {lowestPriceCourse && (
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDuration(lowestPriceCourse.duration)}</span>
                                </div>
                                <PriceDisplay
                                  originalPrice={lowestPriceCourse.price_original}
                                  discountPrice={lowestPriceCourse.price_discount}
                                  size="sm"
                                  showFromSuffix
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // -- MAP VIEW --
  return (
    <div className="relative h-[calc(100vh-7rem)]">
      {/* Top-left badges overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Category badge (when category is active in map mode) */}
        {category && (
          <Badge
            variant="secondary"
            className="text-sm px-3 py-1.5 flex items-center gap-1 shadow-lg bg-background/95 backdrop-blur-sm"
          >
            {category}
            <button
              onClick={handleClearCategory}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
              aria-label="카테고리 필터 해제"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Default location indicator */}
        {usingDefaultLocation && mapReady && (
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-1 flex items-center gap-1.5 shadow-md bg-background/95 backdrop-blur-sm border-orange-200 text-orange-700"
          >
            <MapPin className="w-3 h-3" />
            서울시청 기준
          </Badge>
        )}
      </div>

      {/* Naver Map */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* 지도 로딩 에러 표시 */}
      {mapLoadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 gap-4 p-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <div className="text-center space-y-2">
            <p className="font-semibold text-lg">지도를 불러올 수 없습니다</p>
            <p className="text-sm text-muted-foreground max-w-[320px]">
              네이버 지도 API 인증에 실패했습니다.
            </p>
            <p className="text-xs text-muted-foreground max-w-[320px]">
              NCP 콘솔에서 Web Dynamic Map 서비스 활성화 및 도메인 등록을 확인해주세요.
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              새로고침
            </Button>
            <Button onClick={() => setViewMode('list')} variant="default" size="sm">
              목록으로 보기
            </Button>
          </div>
        </div>
      )}

      {/* Loading overlay while map initializes */}
      {!mapReady && !mapLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Current location button */}
      <Button
        size="icon"
        variant="secondary"
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full shadow-lg"
        onClick={handleMoveToUserLocation}
        disabled={isGettingLocation || !mapReady}
      >
        {isGettingLocation ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Crosshair className="w-5 h-5" />
        )}
      </Button>

      {/* List view toggle button (when category is active) */}
      {category && (
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-4 right-16 z-10 shadow-lg flex items-center gap-1.5"
          onClick={handleToggleView}
        >
          <List className="w-4 h-4" />
          리스트
        </Button>
      )}

      {/* Bottom drawer with shop list */}
      <MapSearchDrawer shops={shops} isLoading={isLoading} hasValidBounds={!!bounds && mapReady} />
    </div>
  );
}

function CategoryShopListSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex gap-3 p-3">
              <div className="w-24 h-24 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-full" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3 mt-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
