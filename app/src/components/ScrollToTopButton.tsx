import { CaretUpIcon } from "phosphor-react-native/src/icons/CaretUp";
import { useTranslation } from "react-i18next";
import { useTheme, XStack } from "tamagui";

import { FloatingButton } from "@/components/ui/FloatingButton";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { SCROLL_TO_TOP_BOTTOM_GAP, SCROLL_TO_TOP_SIDE_GAP } from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

const ICON_SIZE = 22;

export function ScrollToTopButton({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
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
      <FloatingButton label={t("a11y.scrollToTop")} onPress={onPress}>
        <CaretUpIcon
          size={ICON_SIZE}
          weight="bold"
          color={GLASS_ENABLED ? theme.color.val : theme.onFill.val}
        />
      </FloatingButton>
    </XStack>
  );
}
