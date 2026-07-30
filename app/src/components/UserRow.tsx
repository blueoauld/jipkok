import { Text, XStack, YStack } from "tamagui";

import { UserAvatar } from "@/components/UserAvatar";
import { pushOnce } from "@/lib/router";

export type User = {
  id: string;
  nickname: string;
};

export function UserRow({ user }: { user: User }) {
  return (
    <XStack
      gap="$3"
      items="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={() => pushOnce(`/member/${user.id}`)}
    >
      <UserAvatar id={user.id} />

      <YStack flex={1} gap="$1">
        <XStack items="center" justify="space-between" gap="$2">
          <Text flex={1} numberOfLines={1} fontSize="$4" fontWeight="600">
            {user.nickname}
          </Text>
          <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
            방금 전
          </Text>
        </XStack>

        <Text theme="gray" color="$color10" fontSize="$3">
          남자 · 20살 · ♥ 100
        </Text>

        <XStack items="center" justify="space-between" gap="$2">
          <Text
            flex={1}
            numberOfLines={1}
            theme="gray"
            color="$color10"
            fontSize="$3"
          >
            코멘트
          </Text>
          <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
            0.2km
          </Text>
        </XStack>
      </YStack>
    </XStack>
  );
}
