import { CaretUpIcon } from "phosphor-react-native/src/icons/CaretUp";
import { useTranslation } from "react-i18next";
import { useTheme, XStack } from "tamagui";

import { FloatingButton } from "@/components/ui/FloatingButton";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { SCREEN_PADDING } from "@/lib/design";

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
      r={SCREEN_PADDING}
      b={tabBarOverlay + SCREEN_PADDING}
    >
      <FloatingButton label={t("a11y.scrollToTop")} onPress={onPress}>
        <CaretUpIcon size={ICON_SIZE} weight="bold" color={theme.onFill.val} />
      </FloatingButton>
    </XStack>
  );
}
