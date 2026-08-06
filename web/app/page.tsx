import Image from "next/image";
import Link from "next/link";

const CONTACT_EMAIL = "hello@jipkok.app";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.png"
            alt=""
            width={56}
            height={56}
            priority
            className="size-14"
          />
          <h1 className="text-3xl font-bold tracking-tight text-accent">집콕</h1>
          <p className="text-base leading-7 font-medium">
            집에서 보내는 하루도
            <br />
            동네 친구와 함께
          </p>
        </div>

        <Image
          src="/mock.png"
          alt="집콕 앱 화면"
          width={806}
          height={1600}
          priority
          className="h-[46vh] min-h-64 w-auto"
        />

        <div className="flex flex-wrap items-stretch justify-center gap-2.5">
          <span className="flex w-44 items-center justify-center rounded-xl bg-black px-4 py-3.5 text-sm font-medium text-white/60">
            App Store 준비 중
          </span>
          <span className="flex w-44 items-center justify-center rounded-xl bg-black px-4 py-3.5 text-sm font-medium text-white/60">
            Google Play 준비 중
          </span>
        </div>
      </main>

      <footer className="flex flex-col items-center gap-1.5 pt-12 text-center text-sm text-muted">
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="flex flex-wrap items-center justify-center gap-x-2">
          <span>© 2026 JIPKOK</span>
          <span>|</span>
          <Link href="/privacy" className="hover:underline">
            개인정보 처리방침
          </Link>
          <span>|</span>
          <Link href="/terms" className="hover:underline">
            서비스 이용약관
          </Link>
        </p>
      </footer>
    </div>
  );
}
