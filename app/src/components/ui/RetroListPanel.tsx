import type { ReactNode } from "react";
import { XStack, type XStackProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";

export function RetroListPanel({ children }: { children: ReactNode }) {
  return (
    <YStack>
      <RetroShadow color="$gray8" />
      <YStack borderWidth={2} borderColor="$color12" bg="$color1">
        {children}
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
      borderBottomWidth={divider ? 2 : 0}
      borderColor="$color12"
      pressStyle={{ bg: "$color3" }}
      {...props}
    >
      {children}
    </XStack>
  );
}
