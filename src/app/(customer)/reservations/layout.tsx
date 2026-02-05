import { Metadata } from "next";

export const metadata: Metadata = {
  title: "예약 내역 | 오늘의마사지",
  description: "예정된 예약과 지난 예약을 확인하고 관리하세요. 예약 취소 및 상세 정보를 확인할 수 있습니다.",
};

export default function ReservationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
