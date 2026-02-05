import { Metadata } from "next";

export const metadata: Metadata = {
  title: "채팅 | 오늘의마사지",
  description: "마사지샵과 실시간 채팅으로 상담하세요. 예약 전 궁금한 점을 빠르게 해결할 수 있습니다.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
