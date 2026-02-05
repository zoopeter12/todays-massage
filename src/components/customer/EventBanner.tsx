"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Gift,
  Users,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EventItem {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

const events: EventItem[] = [
  {
    href: "/attendance",
    icon: CalendarCheck,
    title: "출석체크",
    description: "매일 출석하고 포인트 받기",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    iconColor: "text-blue-500",
  },
  {
    href: "/roulette",
    icon: Gift,
    title: "럭키룰렛",
    description: "행운의 룰렛 돌리기",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
    iconColor: "text-purple-500",
  },
  {
    href: "/referral",
    icon: Users,
    title: "친구초대",
    description: "친구 초대하고 보상받기",
    bgColor: "bg-gradient-to-br from-green-50 to-green-100",
    iconColor: "text-green-500",
  },
];

export default function EventBanner() {
  return (
    <section className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">이벤트</h2>
        </div>
        <Link
          href="/attendance"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          전체보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {events.map((event, index) => {
          const Icon = event.icon;
          return (
            <motion.div
              key={event.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={event.href}>
                <Card
                  className={`group cursor-pointer border-0 shadow-sm transition-all hover:shadow-md ${event.bgColor}`}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 transition-transform group-hover:scale-110">
                      <Icon className={`h-6 w-6 ${event.iconColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {event.title}
                    </span>
                    <span className="mt-0.5 text-[10px] text-slate-500 text-center line-clamp-1">
                      {event.description}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
