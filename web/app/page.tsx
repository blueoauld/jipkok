import Image from "next/image";
import Link from "next/link";

const CONTACT_EMAIL = "hello@jipkok.app";

const STORES = ["App Store 준비 중", "Google Play 준비 중"];

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
            className="size-14"
          />
          <h1 className="text-3xl font-bold tracking-tight text-accent">
            집콕
          </h1>
          <p className="text-base leading-7 font-medium">
            가까운 이웃의 프로필을 구경하고
            <br />
            쪽지 한 통으로 가볍게 말을 걸어 보세요.
          </p>
        </div>

        <Image
          src="/mock.png"
          alt="집콕 앱 화면"
          width={659}
          height={1300}
          priority
          className="h-[46vh] min-h-64 w-auto"
        />

        <div className="flex flex-wrap items-stretch justify-center gap-2.5">
          {STORES.map((store) => (
            <span
              key={store}
              className="retro-panel flex w-44 items-center justify-center bg-disabled px-4 py-3 text-sm font-bold text-ink/70"
            >
              {store}
            </span>
          ))}
        </div>
      </main>

      <footer className="flex flex-col items-center gap-1.5 pt-12 text-center text-sm text-muted">
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="flex flex-wrap items-center justify-center gap-x-2">
          <span>© 2026 JIPKOK</span>
          <span aria-hidden="true">|</span>
          <Link href="/privacy" className="hover:underline">
            개인정보 처리방침
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/terms" className="hover:underline">
            서비스 이용약관
          </Link>
        </p>
      </footer>
    </div>
  );
}
