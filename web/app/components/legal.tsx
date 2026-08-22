import { Fragment, type ReactNode } from "react";

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="pt-2 text-sm text-muted">Effective {effectiveDate}</p>

      <div className="flex flex-col gap-10 pt-10 text-[15px] leading-7">
        {children}
      </div>
    </main>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-l-4 border-accent pl-2.5 text-lg font-bold">
        {title}
      </h2>
      <div className="flex flex-col gap-3 [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

// 좁은 화면에서는 열이 한 글자 폭까지 찌그러진다. 행을 카드로 쌓아 라벨과 값으로 읽힌다.
export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <>
      <div className="retro-panel hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink bg-subtle">
              {head.map((cell) => (
                <th key={cell} className="px-3 py-2.5 font-bold">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border last:border-0"
              >
                {row.map((cell, index) => (
                  <td
                    key={index}
                    className={`px-3 py-2.5 align-top ${index === 0 ? "font-medium" : "text-muted"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 이 안의 ul 을 글머리표 목록으로 꾸며서 여기서는 ul 을 쓰지 않는다. */}
      <div className="retro-panel flex flex-col text-sm sm:hidden">
        {rows.map(([title, ...details], rowIndex) => (
          <div
            key={rowIndex}
            // 라벨 열은 auto 라 그 카드에서 가장 긴 라벨 폭을 잡는다. 폭을 박으면 긴 라벨이 접힌다.
            className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-2 border-b border-border p-3 last:border-0"
          >
            <span className="col-span-2 font-bold">{title}</span>

            {details.map((detail, index) => (
              <Fragment key={index}>
                <span className="text-muted">{head[index + 1]}</span>
                <span>{detail}</span>
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
