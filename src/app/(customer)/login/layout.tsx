import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | 오늘의마사지",
  description: "오늘의마사지에 로그인하고 다양한 마사지샵을 만나보세요. 간편한 휴대폰 인증으로 빠르게 시작하세요.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
