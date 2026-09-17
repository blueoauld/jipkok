import type { ReactNode } from "react";
import { XStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import { FLOATING_BUTTON_SIZE, PILL_RADIUS, PRESS_OPACITY } from "@/lib/design";
import { GLASS_ENABLED, usePhotoGlass } from "@/lib/glass";

// 내용 위에 떠 있는 원형 버튼이다. 그림자 없는 파란 원이라 아이콘은 흰색으로 넘긴다. iOS 26에서 사진 위에
// 놓이면(overPhoto) 사진이 비치는 유리로 띄우고 아이콘은 usePhotoGlass의 잉크로 넘긴다.
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

  if (!GLASS_ENABLED || !overPhoto) {
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
        tintColor={photoGlass.tint}
        isInteractive
      >
        {children}
      </Glass>
    </XStack>
  );
}
