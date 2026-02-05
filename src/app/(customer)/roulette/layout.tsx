import { Metadata } from "next";

export const metadata: Metadata = {
  title: "럭키룰렛 | 오늘의마사지",
  description: "매일 1회 무료 룰렛을 돌려보세요. 포인트와 쿠폰 등 다양한 보상을 받을 수 있는 행운의 기회입니다.",
};

export default function RouletteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
