import { Text, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { copyText } from "@/lib/clipboard";

export function ProfileSection({
  title,
  body,
  placeholder,
  copiedMessage,
}: {
  title: string;
  body?: string | null;
  placeholder?: string;
  copiedMessage: string;
}) {
  const empty = !body;

  return (
    <YStack gap="$2">
      <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
        {title}
      </Text>
      <RetroCard
        onLongPress={empty ? undefined : () => copyText(body, copiedMessage)}
      >
        <Text fontSize="$4" color={empty ? "$color11" : undefined}>
          {empty ? placeholder : body}
        </Text>
      </RetroCard>
    </YStack>
  );
}
