import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "집콕",
  description:
    "집콕은 가까운 동네 친구를 만드는 채팅 커뮤니티입니다. 시간대별 사진 피드로 일상을 나누고, 쪽지로 가볍게 대화를 시작해 보세요.",
  openGraph: {
    title: "집콕",
    description: "가까운 동네 친구와 대화를 시작해요",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
