"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterItem<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  items: Record<T, string> | FilterItem<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterSelect<T extends string>({
  items,
  value,
  onChange,
}: Props<T>) {
  const entries: FilterItem<T>[] = Array.isArray(items)
    ? items
    : (Object.keys(items) as T[]).map((key) => ({
        value: key,
        label: items[key],
      }));

  return (
    <Select
      items={entries}
      value={value}
      onValueChange={(next) => onChange(next as T)}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {entries.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
