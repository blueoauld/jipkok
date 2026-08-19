import { cn } from "@/lib/utils";

export type StatusTone = "default" | "positive" | "negative" | "muted";

const toneClassNames: Record<StatusTone, string> = {
  default: "",
  positive: "text-emerald-600",
  negative: "text-red-600",
  muted: "text-muted-foreground",
};

type Props = {
  tone: StatusTone;
  children: React.ReactNode;
};

export function StatusText({ tone, children }: Props) {
  return (
    <span className={cn("font-medium", toneClassNames[tone])}>{children}</span>
  );
}
