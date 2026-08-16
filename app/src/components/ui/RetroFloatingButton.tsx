import type { ReactNode } from "react";

import { RetroPressable } from "@/components/ui/RetroPressable";
import { FLOATING_BUTTON_SIZE } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

export function RetroFloatingButton({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  const accent = useAccent();

  return (
    <RetroPressable
      theme={accent}
      width={FLOATING_BUTTON_SIZE}
      height={FLOATING_BUTTON_SIZE}
      bg="$color10"
      pressBg="$color11"
      items="center"
      justify="center"
      onPress={onPress}
    >
      {children}
    </RetroPressable>
  );
}
