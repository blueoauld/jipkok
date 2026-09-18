import type { ReactNode } from "react";

import { Text } from "@/components/ui/Text";

export function EmptyMessage({ children }: { children: ReactNode }) {
  return (
    <Text preset="body" color="$grey600">
      {children}
    </Text>
  );
}
