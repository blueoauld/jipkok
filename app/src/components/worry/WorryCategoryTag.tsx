import { Badge } from "@/components/ui/Badge";
import type { WorryCategory } from "@/lib/api";
import { worryCategoryLabel } from "@/lib/worry";

export function WorryCategoryTag({ category }: { category: WorryCategory }) {
  return (
    <Badge size="xsmall" tone="elephant-weak">
      {worryCategoryLabel(category)}
    </Badge>
  );
}
