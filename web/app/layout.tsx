import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
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
  metadataBase: new URL("https://jipkok.app"),
  title: "Jipkok",
  description:
    "Jipkok is a chat community for meeting people nearby. Share your day through an hourly photo feed, and start a conversation with a single note.",
  openGraph: {
    title: "Jipkok",
    description: "Start a conversation with someone nearby",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-border">
          <Link
            href="/"
            className="mx-auto flex w-full max-w-2xl items-center gap-2 px-6 py-4"
          >
            <Image
              src="/logo.png"
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
            <span className="text-base font-bold tracking-tight">Jipkok</span>
          </Link>
        </header>

        {children}
      </body>
    </html>
  );
}
