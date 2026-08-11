import { Text, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";

export function ProfileSection({
  title,
  body,
  placeholder,
}: {
  title: string;
  body?: string | null;
  placeholder?: string;
}) {
  const empty = !body;

  return (
    <YStack gap="$2">
      <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
        {title}
      </Text>
      <RetroCard>
        <Text fontSize="$4" color={empty ? "$gray10" : undefined}>
          {empty ? placeholder : body}
        </Text>
      </RetroCard>
    </YStack>
  );
}
