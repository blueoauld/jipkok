import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";

// TDS 텍스트 필드 도움말 줄에서 잰 값이다. 글자는 상자 가장자리보다 조금 안쪽에서 시작한다.
const HELP_GAP = 6;
const HELP_INSET = 4;

export function FormField({
  error,
  right,
  children,
}: {
  error?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <YStack gap={HELP_GAP}>
      {children}

      {(error || right) && (
        <XStack justify="space-between" gap="$2" px={HELP_INSET}>
          <Text flex={1} fontSize="$1" color="$red600">
            {error}
          </Text>
          {right}
        </XStack>
      )}
    </YStack>
  );
}
