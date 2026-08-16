import { Spinner, YStack } from "tamagui";

import { ErrorState } from "@/components/ui/ErrorState";
import { isApiError } from "@/lib/api";

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
    <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
      {error ? (
        <ErrorState
          message={isApiError(error) ? error.message : message}
          onRetry={onRetry}
        />
      ) : (
        <Spinner size="small" />
      )}
    </YStack>
  );
}
