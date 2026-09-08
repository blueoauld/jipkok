import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import {
  FLOATING_BUTTON_SIZE,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import { GLASS_ENABLED, PHOTO_GLASS_PROPS } from "@/lib/glass";
import { useAccent } from "@/lib/theme/accent";

// 내용 위에 떠 있는 원형 버튼이다. iOS 26에서는 유리, 그 밖에서는 그림자 없는 레트로
// 상자다. 유리 자리의 폴백은 전부 그림자를 빼서 서로 같은 모양이 되게 한다.
// 사진 위에 놓이면 overPhoto로 밝은 유리에 고정한다.
export function FloatingButton({
  label,
  overPhoto = false,
  onPress,
  children,
}: {
  label: string;
  overPhoto?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const accent = useAccent();

  if (!GLASS_ENABLED) {
    return (
      <XStack
        theme={accent}
        width={FLOATING_BUTTON_SIZE}
        height={FLOATING_BUTTON_SIZE}
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        bg="$color10"
        items="center"
        justify="center"
        pressStyle={{ bg: "$color11" }}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
      >
        {children}
      </XStack>
    );
  }

  return (
    <XStack
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <Glass
        style={{
          width: FLOATING_BUTTON_SIZE,
          height: FLOATING_BUTTON_SIZE,
          borderRadius: FLOATING_BUTTON_SIZE / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
        {...(overPhoto ? PHOTO_GLASS_PROPS : null)}
        isInteractive
      >
        {children}
      </Glass>
    </XStack>
  );
}
