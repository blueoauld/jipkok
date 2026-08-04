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
    "부담 없이 건네는 첫 쪽지. 가까운 거리의 사람들과 천천히 이야기를 시작해보세요.",
  openGraph: {
    title: "집콕",
    description: "부담 없이 건네는 첫 쪽지",
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
