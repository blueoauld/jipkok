import { Text, XStack, YStack } from "tamagui";

import { UserAvatar } from "@/components/UserAvatar";
import { pushOnce } from "@/lib/router";

export type Chat = {
  id: string;
  nickname: string;
  unreadCount: number;
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <XStack
      shrink={0}
      bg="$red10"
      rounded={9999}
      height={20}
      minW={20}
      px={6}
      items="center"
      justify="center"
    >
      <Text color="white" fontSize="$1" fontWeight="600">
        {count > 99 ? "99+" : count}
      </Text>
    </XStack>
  );
}

export function ChatRow({ chat }: { chat: Chat }) {
  return (
    <XStack
      gap="$3"
      items="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={() => pushOnce(`/chat/${chat.id}`)}
    >
      <UserAvatar id={chat.id} />

      <YStack flex={1} gap="$2">
        <XStack items="center" justify="space-between" gap="$2">
          <Text flex={1} numberOfLines={1} fontSize="$4" fontWeight="600">
            {chat.nickname}
          </Text>
          <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
            오후 1:03
          </Text>
        </XStack>

        <XStack items="center" justify="space-between" gap="$2">
          <Text
            flex={1}
            numberOfLines={2}
            theme="gray"
            color="$color10"
            fontSize="$3"
          >
            코멘트
          </Text>
          <UnreadBadge count={chat.unreadCount} />
        </XStack>
      </YStack>
    </XStack>
  );
}
