import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

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
      <Text preset="body" color="$grey600" text="center">
        {message}
      </Text>

      <Button onPress={onRetry}>{t("component.retry")}</Button>
    </YStack>
  );
}
