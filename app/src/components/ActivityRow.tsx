import { TrashIcon } from "phosphor-react-native";
import { Avatar, Text, XStack, YStack } from "tamagui";

export type ActivityMember = {
  id: string;
  nickname: string;
};

function DeleteButton({ onPress }: { onPress: () => void }) {
  return (
    <XStack
      shrink={0}
      width={48}
      height={48}
      rounded={9999}
      bg="$red10"
      items="center"
      justify="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={onPress}
    >
      <TrashIcon size={24} weight="fill" color="white" />
    </XStack>
  );
}

export function ActivityRow({
  member,
  onDelete,
}: {
  member: ActivityMember;
  onDelete: () => void;
}) {
  return (
    <XStack gap="$3" items="center">
      <Avatar size="$6" rounded="$7">
        <Avatar.Image src={`https://picsum.photos/seed/${member.id}/200`} />
        <Avatar.Fallback bg="$gray5" />
      </Avatar>

      <YStack flex={1} gap="$1">
        <Text numberOfLines={1} fontSize="$4" fontWeight="600">
          {member.nickname}
        </Text>
        <Text theme="gray" color="$color10" fontSize="$3">
          남자 · 20살 · ♥ 100
        </Text>
        <Text numberOfLines={1} theme="gray" color="$color10" fontSize="$3">
          코멘트
        </Text>
      </YStack>

      <DeleteButton onPress={onDelete} />
    </XStack>
  );
}
