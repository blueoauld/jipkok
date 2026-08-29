import { useTranslation } from "react-i18next";
import { getTokens, XStack, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useThemeBackground } from "@/lib/theme/accent";

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
  const background = useThemeBackground();
  const disabled = count === 0 || pending;
  const tabBarOverlay = useTabBarOverlay();

  return (
    // 흐름 안에 있어 떠 있는 탭 바가 그대로 덮는다. 바탕은 바닥까지 두고 버튼만 올린다.
    <YStack
      px="$4"
      pt="$4"
      pb={getTokens().space.$4.val + tabBarOverlay}
      bg={background}
    >
      <XStack gap="$3">
        <RetroButton flex={1} disabled={disabled} onPress={onMarkRead}>
          {t("component.markRead")}
        </RetroButton>

        <RetroButton flex={1} theme="red" disabled={disabled} onPress={onLeave}>
          {t("action.leave")}
        </RetroButton>
      </XStack>
    </YStack>
  );
}
