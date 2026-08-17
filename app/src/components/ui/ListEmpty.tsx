import type { ReactNode } from "react";
import { YStack } from "tamagui";

import { EmptyMessage } from "@/components/ui/EmptyMessage";

// FlatList의 ListEmptyComponent 자리에 그대로 넣는다.
export function ListEmpty({ children }: { children: ReactNode }) {
  return (
    <YStack items="center" py="$8">
      <EmptyMessage>{children}</EmptyMessage>
    </YStack>
  );
}
