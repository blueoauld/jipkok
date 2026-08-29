import type { ReactNode } from "react";
import { Text, XStack } from "tamagui";

import { RETRO_BORDER_WIDTH } from "@/lib/design";

const SIZE = 20;
const FONT_SIZE = 11;

export function RetroBadge({ children }: { children: ReactNode }) {
  return (
    <XStack
      shrink={0}
      minW={SIZE}
      minH={SIZE}
      px="$1.5"
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg="$red10"
      items="center"
      justify="center"
    >
      <Text color="white" fontSize={FONT_SIZE} fontWeight="700">
        {children}
      </Text>
    </XStack>
  );
}
