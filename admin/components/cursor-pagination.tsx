import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function CursorPagination({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: Props) {
  if (!hasPrevious && !hasNext) return null;

  return (
    <div className="flex w-full items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={!hasPrevious}
        onClick={onPrevious}
        aria-label="이전 페이지"
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!hasNext}
        onClick={onNext}
        aria-label="다음 페이지"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
