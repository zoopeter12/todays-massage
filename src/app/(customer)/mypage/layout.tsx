import { Metadata } from "next";

export const metadata: Metadata = {
  title: "마이페이지 | 오늘의마사지",
  description: "내 정보, 예약 내역, 찜한 가게, 포인트, 쿠폰을 관리하세요. 출석체크와 럭키룰렛 이벤트에도 참여하실 수 있습니다.",
};

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
