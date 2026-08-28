import Image from "next/image";
import Link from "next/link";

const CONTACT_EMAIL = "hello@jipkok.app";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.blueoauld.jipkok";

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
            Jipkok
          </h1>
          <p className="text-base leading-7 font-medium">
            Browse the people nearby and
            <br />
            say hello with a single note.
          </p>
        </div>

        <Image
          src="/mock.png"
          alt="The Jipkok app"
          width={659}
          height={1300}
          priority
          className="h-[46vh] min-h-64 w-auto"
        />

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {/* 앱스토어는 아직 미출시라 배지를 흐리게만 보여준다. */}
          <Image
            src="/app-store-badge.svg"
            alt="Coming soon to the App Store"
            width={120}
            height={40}
            className="h-12 w-40 opacity-40 grayscale"
          />
          <a href={PLAY_STORE_URL}>
            <Image
              src="/google-play-badge.png"
              alt="Get it on Google Play"
              width={564}
              height={168}
              className="h-12 w-40"
            />
          </a>
        </div>
      </main>

      <footer className="flex flex-col items-center gap-1.5 pt-12 text-center text-sm text-muted">
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="flex flex-wrap items-center justify-center gap-x-2">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <span aria-hidden="true">|</span>
          <Link href="/delete-account" className="hover:underline">
            Delete Account
          </Link>
        </p>
        <p>© 2026 JIPKOK</p>
      </footer>
    </div>
  );
}
