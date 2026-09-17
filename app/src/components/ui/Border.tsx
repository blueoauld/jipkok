import { YStack } from "tamagui";

import { SECTION_DIVIDER_HEIGHT } from "@/lib/design";

// TDS Border에서 잰 값이다. 선은 0.5px 옅은 선이다.
const HAIRLINE_HEIGHT = 0.5;

export function Border({
  variant = "full",
}: {
  variant?: "full" | "height16";
}) {
  if (variant === "height16") {
    return <YStack height={SECTION_DIVIDER_HEIGHT} bg="$greyBackground" />;
  }

  return <YStack height={HAIRLINE_HEIGHT} bg="$hairline" />;
}
