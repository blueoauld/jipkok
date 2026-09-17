import { Spinner, YStack } from "tamagui";

import { ErrorState } from "@/components/ui/ErrorState";
import { apiErrorMessage } from "@/lib/alert";
import { SCREEN_PADDING } from "@/lib/design";

export function ScreenState({
  error,
  message,
  onRetry,
}: {
  error: unknown;
  message: string;
  onRetry: () => void;
}) {
  return (
    <YStack flex={1} justify="center" items="center" p={SCREEN_PADDING}>
      {error ? (
        <ErrorState
          message={apiErrorMessage(error, message)}
          onRetry={onRetry}
        />
      ) : (
        <Spinner size="small" color="$grey500" />
      )}
    </YStack>
  );
}
