import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props<T> = {
  value: T;
  defaultValue: T;
  onReset: (value: T) => void;
};

export function FilterResetButton<T>({
  value,
  defaultValue,
  onReset,
}: Props<T>) {
  if (JSON.stringify(value) === JSON.stringify(defaultValue)) return null;

  return (
    <Button variant="ghost" onClick={() => onReset(defaultValue)}>
      <X data-icon="inline-start" />
      초기화
    </Button>
  );
}
