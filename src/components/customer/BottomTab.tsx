"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MapPin,
  Heart,
  Calendar,
  MessageCircle,
  // Filled variants for active state
} from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/nearby", label: "내 주변", icon: MapPin },
  { href: "/favorites", label: "찜", icon: Heart },
  { href: "/reservations", label: "예약", icon: Calendar },
  { href: "/chat", label: "상담", icon: MessageCircle },
];

export default function BottomTab() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="메인 네비게이션"
    >
      <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700 active:scale-95"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
            >
              {/* 활성 인디케이터 */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              {/* 아이콘 컨테이너 */}
              <motion.div
                className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-200 ${
                  isActive ? "bg-primary/10" : ""
                }`}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
              >
                <Icon
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive ? "stroke-[2.5px]" : "stroke-[1.75px]"
                  }`}
                  fill={isActive ? "currentColor" : "none"}
                  fillOpacity={isActive ? 0.15 : 0}
                />
              </motion.div>

              {/* 라벨 */}
              <span
                className={`text-[10px] font-medium transition-all duration-200 ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
