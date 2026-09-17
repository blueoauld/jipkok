import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

import { BottomCTAFade } from "@/components/ui/BottomCTAFade";
import { Button } from "@/components/ui/Button";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import {
  BOTTOM_CTA_GAP,
  BOTTOM_CTA_PADDING_BOTTOM,
  SCREEN_PADDING,
} from "@/lib/design";

export function ChatSelectionBar({
  count,
  pending,
  onMarkRead,
  onLeave,
}: {
  count: number;
  pending: boolean;
  onMarkRead: () => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation();
  const disabled = count === 0 || pending;
  const tabBarOverlay = useTabBarOverlay();

  return (
    // 흐름 안에 있어 떠 있는 탭 바가 그대로 덮는다. 바탕은 바닥까지 두고 버튼만 올린다.
    <YStack
      px={SCREEN_PADDING}
      pb={BOTTOM_CTA_PADDING_BOTTOM + tabBarOverlay}
      bg="$background"
    >
      <BottomCTAFade />

      <XStack gap={BOTTOM_CTA_GAP}>
        <Button
          flex={1}
          size="xlarge"
          variant="secondary"
          disabled={disabled}
          onPress={onMarkRead}
        >
          {t("component.markRead")}
        </Button>

        <Button
          flex={1}
          size="xlarge"
          variant="danger"
          disabled={disabled}
          onPress={onLeave}
        >
          {t("action.leave")}
        </Button>
      </XStack>
    </YStack>
  );
}
