import { Spinner, YStack } from "tamagui";

import { ErrorState } from "@/components/ui/ErrorState";
import { isApiError } from "@/lib/api";

/**
 * 아직 내용을 못 그리는 화면의 자리. error에는 잡은 오류를 그대로 넘기면
 * 되고, 서버가 준 문구가 없을 때만 message가 쓰인다.
 */
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
