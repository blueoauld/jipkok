"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props<T extends string> = {
  items: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
};

export function FilterSelect<T extends string>({
  items,
  value,
  onChange,
}: Props<T>) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next as T)}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {(Object.keys(items) as T[]).map((key) => (
          <SelectItem key={key} value={key}>
            {items[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
