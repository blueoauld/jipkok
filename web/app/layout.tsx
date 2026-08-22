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
