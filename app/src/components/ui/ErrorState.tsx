import { useTranslation } from "react-i18next";
import { Text, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <YStack items="center" gap="$4">
      <Text color="$gray10" fontSize="$4" text="center">
        {message}
      </Text>

      <RetroButton onPress={onRetry}>{t("component.retry")}</RetroButton>
    </YStack>
  );
}
