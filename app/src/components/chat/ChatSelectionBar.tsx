import { useTranslation } from "react-i18next";
import { XStack, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
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

  return (
    <YStack px="$4" py="$4" bg={background}>
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
