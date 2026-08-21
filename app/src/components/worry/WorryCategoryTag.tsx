import { Text, XStack } from "tamagui";

import type { WorryCategory } from "@/lib/api";
import { RETRO_BORDER_WIDTH } from "@/lib/design";
import { worryCategoryLabel } from "@/lib/worry";

const FONT_SIZE = 11;

export function WorryCategoryTag({ category }: { category: WorryCategory }) {
  return (
    <XStack
      theme="gray"
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg="$color3"
      px="$1.5"
      py="$0.5"
      items="center"
    >
      <Text color="$color12" fontSize={FONT_SIZE} fontWeight="700">
        {worryCategoryLabel(category)}
      </Text>
    </XStack>
  );
}
