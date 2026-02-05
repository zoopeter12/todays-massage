import { Metadata } from "next";

export const metadata: Metadata = {
  title: "출석체크 | 오늘의마사지",
  description: "매일 출석체크하고 포인트를 받아가세요. 연속 출석 시 추가 보너스 포인트를 드립니다.",
};

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
