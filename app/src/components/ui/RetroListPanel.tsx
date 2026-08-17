import type { ReactNode } from "react";
import { XStack, type XStackProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { RETRO_BORDER_WIDTH } from "@/lib/design";

export function RetroListPanel({ children }: { children: ReactNode }) {
  return (
    <YStack>
      <RetroShadow color="$gray8" />
      <YStack bg="$color1" py={RETRO_BORDER_WIDTH}>
        {children}

        <YStack
          fullscreen
          borderWidth={RETRO_BORDER_WIDTH}
          borderColor="$gray12"
          pointerEvents="none"
        />
      </YStack>
    </YStack>
  );
}

// 박스형 메뉴의 칸은 가라앉지 않고 배경만 변한다.
export function RetroListRow({
  divider,
  children,
  ...props
}: XStackProps & { divider: boolean }) {
  return (
    <XStack
      items="center"
      px="$4"
      py="$3"
      borderBottomWidth={divider ? RETRO_BORDER_WIDTH : 0}
      borderColor="$gray12"
      pressStyle={{ bg: "$color3" }}
      {...props}
    >
      {children}
    </XStack>
  );
}
