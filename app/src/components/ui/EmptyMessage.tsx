import type { ReactNode } from "react";
import { Text } from "tamagui";

export function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <Text theme="gray" color="$color10" fontSize="$4">
      {children}
    </Text>
  );
}
