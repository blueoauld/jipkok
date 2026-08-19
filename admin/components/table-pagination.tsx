import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";

type Props = {
  page: number;
  size: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  page,
  size,
  totalCount,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / size));

  return (
    <div className="relative flex w-full items-center justify-center">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft />
        </Button>
        {pageNumbers(page, totalPages).map((item, index) =>
          item === null ? (
            <span
              key={`gap-${index}`}
              className="flex size-8 items-center justify-center text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "outline" : "ghost"}
              size="icon"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight />
        </Button>
      </div>
      <p className="absolute right-0 text-sm text-muted-foreground">
        총 {formatCount(totalCount)}건
      </p>
    </div>
  );
}

function pageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  return sorted.flatMap((p, i) =>
    i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p],
  );
}
