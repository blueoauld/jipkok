import { CaretUpIcon } from "phosphor-react-native/src/icons/CaretUp";
import { useTranslation } from "react-i18next";
import { XStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { FLOATING_BUTTON_SIZE } from "@/lib/design";
import { useAccent } from "@/lib/theme/accent";

const ICON_SIZE = 20;

export const SCROLL_TO_TOP_BOTTOM_GAP = 18;
export const SCROLL_TO_TOP_SIDE_GAP = 16;

export function ScrollToTopButton({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const accent = useAccent();
  const tabBarOverlay = useTabBarOverlay();

  if (!visible) {
    return null;
  }

  return (
    <XStack
      position="absolute"
      r={SCROLL_TO_TOP_SIDE_GAP}
      b={tabBarOverlay + SCROLL_TO_TOP_BOTTOM_GAP}
    >
      <RetroCard
        theme={accent}
        shadow="$gray12"
        bg="$color10"
        pressBg="$color11"
        p={0}
        width={FLOATING_BUTTON_SIZE}
        height={FLOATING_BUTTON_SIZE}
        items="center"
        justify="center"
        accessibilityRole="button"
        accessibilityLabel={t("a11y.scrollToTop")}
        onPress={onPress}
      >
        <CaretUpIcon size={ICON_SIZE} weight="bold" color="white" />
      </RetroCard>
    </XStack>
  );
}
