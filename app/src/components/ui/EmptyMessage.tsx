import type { ReactNode } from "react";
import { Text } from "tamagui";

export function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <Text color="$grey600" fontSize="$4">
      {children}
    </Text>
  );
}
