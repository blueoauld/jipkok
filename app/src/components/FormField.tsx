import type { ReactNode } from "react";
import { Text, XStack, YStack } from "tamagui";

import { FIELD_TEXT_GAP, FIELD_TEXT_INSET } from "@/lib/design";

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
    <YStack gap={FIELD_TEXT_GAP}>
      {children}

      {(error || right) && (
        <XStack justify="space-between" gap="$2" px={FIELD_TEXT_INSET}>
          <Text flex={1} fontSize="$1" lineHeight="$1" color="$red600">
            {error}
          </Text>
          {right}
        </XStack>
      )}
    </YStack>
  );
}
