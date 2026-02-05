'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DollarSign, Sparkles, Crown } from 'lucide-react';
import type { PriceRange } from '@/types/filters';

const PRICE_RANGE_CONFIG: Record<
  PriceRange,
  {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    gradient: string;
    iconColor: string;
  }
> = {
  '3-5만원': {
    title: '3~5만원',
    subtitle: '가성비 추천',
    icon: DollarSign,
    gradient: 'from-green-500 to-emerald-600',
    iconColor: 'text-green-600',
  },
  '5-8만원': {
    title: '5~8만원',
    subtitle: '프리미엄',
    icon: Sparkles,
    gradient: 'from-blue-500 to-indigo-600',
    iconColor: 'text-blue-600',
  },
  '8만원이상': {
    title: '8만원 이상',
    subtitle: '럭셔리',
    icon: Crown,
    gradient: 'from-purple-500 to-pink-600',
    iconColor: 'text-purple-600',
  },
};

interface PriceRangeSectionProps {
  className?: string;
}

export default function PriceRangeSection({ className = '' }: PriceRangeSectionProps) {
  const router = useRouter();

  const handlePriceRangeClick = (range: PriceRange) => {
    const params = new URLSearchParams({ priceRange: range });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">가격대별 추천</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(PRICE_RANGE_CONFIG).map(([range, config], index) => {
          const Icon = config.icon;

          return (
            <motion.div
              key={range}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => handlePriceRangeClick(range as PriceRange)}
                className="w-full group relative overflow-hidden rounded-2xl p-6 bg-white border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative z-10">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${config.gradient} mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {config.title}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {config.subtitle}
                  </p>

                  <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                    둘러보기
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
