import { YStack } from "tamagui";

import { LIST_ROW_PADDING_X, SECTION_DIVIDER_HEIGHT } from "@/lib/design";

// TDS Border에서 잰 값이다. 선은 0.5px 옅은 선이고, padding24는 왼쪽만 들여쓴다.
const HAIRLINE_HEIGHT = 0.5;

export function Border({
  variant = "full",
}: {
  variant?: "full" | "padding24" | "height16";
}) {
  if (variant === "height16") {
    return <YStack height={SECTION_DIVIDER_HEIGHT} bg="$greyBackground" />;
  }

  return (
    <YStack
      height={HAIRLINE_HEIGHT}
      ml={variant === "padding24" ? LIST_ROW_PADDING_X : 0}
      bg="$hairline"
    />
  );
}
