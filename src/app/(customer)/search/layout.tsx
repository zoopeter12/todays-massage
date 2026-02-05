import { Metadata } from "next";

export const metadata: Metadata = {
  title: "마사지샵 검색 | 오늘의마사지",
  description: "지도와 리스트로 마사지샵을 검색하고 비교해보세요. 카테고리별 필터링과 가격, 위치 정보를 한눈에 확인하세요.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
