import { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 주변 마사지샵 | 오늘의마사지",
  description: "내 주변 반경 3km 이내의 마사지샵을 찾아보세요. 실시간 위치 기반으로 가까운 마사지샵을 추천해드립니다.",
};

export default function NearbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
