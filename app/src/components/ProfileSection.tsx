import { Text, YStack } from "tamagui";

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
      <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
        {title}
      </Text>
      <Text
        fontSize="$4"
        bg="$gray4"
        rounded="$5"
        p="$3"
        color={empty ? "$gray10" : undefined}
      >
        {empty ? placeholder : body}
      </Text>
    </YStack>
  );
}
