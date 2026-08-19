import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function IdSearchInput({ placeholder, value, onChange }: Props) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="w-40 pr-8 focus-visible:border-input focus-visible:ring-0"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      />
    </div>
  );
}
