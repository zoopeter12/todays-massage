"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Grid3X3,
  ThumbsUp,
  Leaf,
  Droplets,
  Dumbbell,
  FootprintsIcon,
  Heart,
  Hand,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchBanners,
  fetchCategories,
  fetchRecommendedShops,
} from "@/lib/api/shops";
import EventBanner from "@/components/customer/EventBanner";
import { PriceDisplay } from "@/components/customer/PriceDisplay";

// Category icon mapping - more intuitive icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  타이: Hand,
  스웨디시: Droplets,
  아로마: Leaf,
  스포츠: Dumbbell,
  발: FootprintsIcon,
  커플: Heart,
};

// Category color mapping - enhanced gradient backgrounds
const CATEGORY_COLORS: Record<string, string> = {
  타이: "bg-gradient-to-br from-pink-100 to-pink-200 text-pink-600",
  스웨디시: "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600",
  아로마: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600",
  스포츠: "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600",
  발: "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600",
  커플: "bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600",
};

export default function CustomerHomePage() {
  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
    // 배너 로딩 실패해도 앱 중단하지 않음 (fallback으로 인기 샵 표시)
    retry: 1,
    retryDelay: 500,
  });

  // 자동 슬라이드 상태
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 다음 배너로 이동
  const nextBanner = useCallback(() => {
    if (banners && banners.length > 1) {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }
  }, [banners]);

  // 특정 배너로 이동
  const goToBanner = useCallback((index: number) => {
    setCurrentBannerIndex(index);
  }, []);

  // 자동 슬라이드 (4초 간격)
  useEffect(() => {
    if (isPaused || !banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      nextBanner();
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, banners, nextBanner]);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: recommendedShops, isLoading: shopsLoading } = useQuery({
    queryKey: ["recommended-shops"],
    queryFn: fetchRecommendedShops,
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-screen-sm">
        {/* Banner Slider Section - Auto Slide */}
        <section className="bg-white pb-6">
          <div
            className="relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {bannersLoading ? (
              <div className="px-4 pt-4 pb-2">
                <Skeleton className="h-52 w-full rounded-2xl" />
              </div>
            ) : banners && banners.length > 0 ? (
              <>
                {/* 배너 슬라이드 컨테이너 */}
                <div className="relative h-52 mx-4 mt-4 mb-2 rounded-2xl overflow-hidden">
                  <AnimatePresence mode="wait">
                    {banners.map((banner, index) => {
                      if (index !== currentBannerIndex) return null;

                      // 배너 링크 결정 (관리자 배너면 link_url, 샵이면 /shops/{id})
                      const bannerLink = 'link_url' in banner && banner.link_url
                        ? banner.link_url
                        : `/shops/${banner.id}`;
                      const bannerImage = 'image_url' in banner
                        ? banner.image_url
                        : (banner.images?.[0] || '');
                      const bannerTitle = 'title' in banner ? banner.title : banner.name;

                      return (
                        <motion.div
                          key={banner.id}
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute inset-0"
                        >
                          <Link href={bannerLink}>
                            <div className="group relative h-full w-full">
                              {bannerImage ? (
                                <Image
                                  src={bannerImage}
                                  alt={bannerTitle}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  unoptimized
                                  priority={index === 0}
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-purple-400 to-pink-400" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                              <div className="absolute top-3 left-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-pink-600 backdrop-blur-sm">
                                  <Sparkles className="h-3 w-3" />
                                  HOT
                                </span>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-5">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium text-white/90">
                                    {('view_count' in banner ? banner.view_count : ('click_count' in banner ? banner.click_count : 0))?.toLocaleString() || 0} views
                                  </span>
                                </div>
                                <h3 className="mt-1 text-xl font-bold text-white drop-shadow-md">
                                  {bannerTitle}
                                </h3>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Indicator dots - 클릭 가능 */}
                {banners.length > 1 && (
                  <div className="flex justify-center gap-2 pt-3">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToBanner(index)}
                        aria-label={`배너 ${index + 1}로 이동`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentBannerIndex
                            ? "w-6 bg-pink-500"
                            : "w-2 bg-slate-300 hover:bg-slate-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 pt-4 pb-2">
                <div className="h-52 w-full rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <p className="text-white text-lg font-semibold">오늘의 마사지</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Event Banner Section - Slate background */}
        <div className="bg-slate-50 py-6">
          <EventBanner />
        </div>

        {/* Categories Grid Section - White background */}
        <section className="bg-white py-6 px-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">카테고리</h2>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-pink-600 transition-colors"
            >
              전체보기
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {categories?.map((category, index) => {
                const Icon = CATEGORY_ICONS[category] || Hand;
                const colorClass = CATEGORY_COLORS[category] || "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600";

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/search?category=${category}`}>
                      <Card className="group cursor-pointer border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                        <CardContent className="flex flex-col items-center justify-center p-4">
                          <div
                            className={`mb-2.5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-110 ${colorClass}`}
                          >
                            <Icon className="h-7 w-7" strokeWidth={1.5} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                            {category}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Shops List Section - Slate background */}
        <section className="bg-slate-50 py-6 px-4 pb-10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-pink-500" />
              <h2 className="text-lg font-bold text-slate-900">추천 샵</h2>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-pink-600 transition-colors"
            >
              더보기
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {shopsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      <Skeleton className="h-24 w-24 flex-shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedShops?.map((shop, index) => {
                const lowestPriceCourse = shop.courses && shop.courses.length > 0
                  ? shop.courses.reduce(
                      (min, course) =>
                        (course.price_discount || course.price_original) <
                        (min.price_discount || min.price_original)
                          ? course
                          : min,
                      shop.courses[0]
                    )
                  : null;

                return (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/shops/${shop.id}`}>
                      <Card className="group overflow-hidden border-0 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            {/* Thumbnail */}
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                              {shop.images && shop.images.length > 0 ? (
                                <Image
                                  src={shop.images[0]}
                                  alt={shop.name}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                                  unoptimized
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
                              )}
                              {/* Ranking badge for top 3 */}
                              {index < 3 && (
                                <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white shadow">
                                  {index + 1}
                                </div>
                              )}
                            </div>

                            {/* Shop Info */}
                            <div className="flex flex-1 flex-col justify-between">
                              <div>
                                <h3 className="mb-1 line-clamp-1 font-semibold text-slate-900 group-hover:text-pink-600 transition-colors">
                                  {shop.name}
                                </h3>
                                {shop.address && (
                                  <div className="mb-1.5 flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                      {shop.address}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-medium text-slate-600">
                                      {shop.view_count.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Lowest Price Course */}
                              {lowestPriceCourse && (
                                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                                  <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                    <Clock className="h-3 w-3" />
                                    <span>{lowestPriceCourse.duration}분</span>
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
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
