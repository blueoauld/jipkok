import type { ReactNode } from "react";

import { RetroPressable } from "@/components/ui/RetroPressable";
import { FLOATING_BUTTON_SIZE } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

export function RetroFloatingButton({
  children,
  label,
  onPress,
}: {
  children: ReactNode;
  label: string;
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
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {children}
    </RetroPressable>
  );
}
