"use client";

import { Input } from "@/components/ui/input";
import { formatIsoDate } from "@/lib/format";

export type DateRange = {
  startDate: string;
  endDate: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function recentDateRange(days: number, endDaysAgo = 0): DateRange {
  const end = Date.now() - endDaysAgo * DAY_MS;
  return {
    startDate: formatIsoDate(new Date(end - (days - 1) * DAY_MS)),
    endDate: formatIsoDate(new Date(end)),
  };
}

type Props<T extends DateRange> = {
  value: T;
  onChange: (value: T) => void;
};

export function DateRangeInputs<T extends DateRange>({
  value,
  onChange,
}: Props<T>) {
  const change = (key: keyof DateRange, next: string) => {
    if (next) onChange({ ...value, [key]: next });
  };

  return (
    <>
      <Input
        type="date"
        className="w-36"
        value={value.startDate}
        max={value.endDate}
        onChange={(event) => change("startDate", event.target.value)}
      />
      <span className="text-muted-foreground">~</span>
      <Input
        type="date"
        className="w-36"
        value={value.endDate}
        min={value.startDate}
        onChange={(event) => change("endDate", event.target.value)}
      />
    </>
  );
}
