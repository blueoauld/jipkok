import { Text, XStack } from "tamagui";

import { formatDateLabel } from "@/lib/date";

export function ChatDay({ createdAt }: { createdAt: string }) {
  return (
    <XStack justify="center" py="$3">
      <XStack
        borderWidth={2}
        borderColor="$color12"
        bg="$color1"
        px="$3"
        py="$1"
      >
        <Text fontSize="$2" fontWeight="600" color="$color12">
          {formatDateLabel(new Date(createdAt))}
        </Text>
      </XStack>
    </XStack>
  );
}
