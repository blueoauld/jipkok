import type { ReactNode } from "react";
import { XStack, YStack } from "tamagui";

import { FieldLabel } from "@/components/ui/FieldLabel";
import { Text } from "@/components/ui/Text";
import { FIELD_TEXT_GAP, FIELD_TEXT_INSET } from "@/lib/design";

export function FormField({
  label,
  error,
  right,
  children,
}: {
  label?: string;
  error?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <YStack gap={FIELD_TEXT_GAP}>
      {label && <FieldLabel>{label}</FieldLabel>}

      {children}

      {(error || right) && (
        <XStack justify="space-between" gap="$2" px={FIELD_TEXT_INSET}>
          <Text preset="note" flex={1} color="$red600">
            {error}
          </Text>
          {right}
        </XStack>
      )}
    </YStack>
  );
}
