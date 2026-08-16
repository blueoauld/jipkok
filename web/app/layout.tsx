import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b-2 border-ink bg-accent">
          <Link
            href="/"
            className="inline-block px-4 py-2.5 font-mono text-sm font-bold tracking-wide text-white"
          >
            JIPKOK.EXE
          </Link>
        </header>

        {children}
      </body>
    </html>
  );
}
