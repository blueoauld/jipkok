import type { ReactNode } from "react";
import { YStack } from "tamagui";

import { EmptyMessage } from "@/components/ui/EmptyMessage";

export function ListEmpty({ children }: { children: ReactNode }) {
  return (
    <YStack items="center" py="$8">
      <EmptyMessage>{children}</EmptyMessage>
    </YStack>
  );
}
