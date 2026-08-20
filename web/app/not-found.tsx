import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-muted">주소가 바뀌었거나 없는 페이지입니다.</p>
      <Link
        href="/"
        className="retro-panel bg-accent px-5 py-2.5 text-sm font-bold text-white"
      >
        처음으로
      </Link>
    </main>
  );
}
