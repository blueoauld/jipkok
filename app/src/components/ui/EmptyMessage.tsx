import type { ReactNode } from "react";
import { Text } from "tamagui";

export function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <Text theme="gray" color="$color11" fontSize="$4">
      {children}
    </Text>
  );
}
