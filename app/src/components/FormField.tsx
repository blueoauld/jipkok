import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";

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
    <YStack gap="$2">
      {children}

      {(error || right) && (
        <XStack justify="space-between" gap="$2">
          <Text flex={1} theme="red" color="$color10">
            {error}
          </Text>
          {right}
        </XStack>
      )}
    </YStack>
  );
}
