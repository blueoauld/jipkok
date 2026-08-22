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
        className="retro-panel bg-accent px-5 py-2.5 text-sm font-bold text-white"
      >
        Go home
      </Link>
    </main>
  );
}
