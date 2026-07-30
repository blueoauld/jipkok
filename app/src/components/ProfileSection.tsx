import { Text, YStack } from "tamagui";

export function ProfileSection({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <YStack gap="$2">
      <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
        {title}
      </Text>
      <Text fontSize="$4" bg="$gray4" rounded="$5" p="$3">
        {body}
      </Text>
    </YStack>
  );
}
