import { useTranslation } from "react-i18next";
import { Text, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";

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
      <Text color="$grey600" fontSize="$4" lineHeight="$4" text="center">
        {message}
      </Text>

      <Button onPress={onRetry}>{t("component.retry")}</Button>
    </YStack>
  );
}
