import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-muted">
        The address may have changed, or the page may not exist.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
      >
        Go home
      </Link>
    </main>
  );
}
