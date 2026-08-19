import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  className?: string;
};

export function SearchInput({
  placeholder,
  value,
  onChange,
  numeric = false,
  className,
}: Props) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={cn(
          "w-40 pr-8 focus-visible:border-input focus-visible:ring-0",
          className,
        )}
        inputMode={numeric ? "numeric" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(event) =>
          onChange(
            numeric
              ? event.target.value.replace(/\D/g, "")
              : event.target.value,
          )
        }
      />
    </div>
  );
}
