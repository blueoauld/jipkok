import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import { FLOATING_BUTTON_SIZE, PILL_RADIUS, PRESS_OPACITY } from "@/lib/design";
import { GLASS_ENABLED, usePhotoGlass } from "@/lib/glass";

// 내용 위에 떠 있는 원형 버튼이다. iOS 26에서는 유리, 그 밖에서는 그림자 없는 파란 원이라 아이콘은
// 흰색으로 넘긴다. 사진 위에 놓이면 overPhoto로 밝은 유리에 고정한다.
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
  const photoGlass = usePhotoGlass();

  if (!GLASS_ENABLED) {
    return (
      <XStack
        width={FLOATING_BUTTON_SIZE}
        height={FLOATING_BUTTON_SIZE}
        rounded={PILL_RADIUS}
        bg="$blue500"
        items="center"
        justify="center"
        pressStyle={{ bg: "$blue600" }}
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
        tintColor={overPhoto ? photoGlass.tint : undefined}
        isInteractive
      >
        {children}
      </Glass>
    </XStack>
  );
}
