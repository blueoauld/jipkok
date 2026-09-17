import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

import { BottomCTAFade } from "@/components/ui/BottomCTAFade";
import { Button } from "@/components/ui/Button";
import { useWindowInsets } from "@/hooks/useWindowInsets";
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
  const insets = useWindowInsets();

  return (
    // 고르는 동안에는 탭 바를 숨기므로 화면 바닥에 붙는다. 버튼 아래는 안전영역과 아래 여백 중 큰 값이다.
    <YStack
      px={SCREEN_PADDING}
      pb={Math.max(BOTTOM_CTA_PADDING_BOTTOM, insets.bottom)}
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
