import { Text, XStack, YStack } from "tamagui";

import { UserAvatar } from "@/components/UserAvatar";
import type { ChatRoomResponse } from "@/lib/api";
import { formatChatTime } from "@/lib/date";
import { pushOnce } from "@/lib/router";

const PHOTO_MESSAGE = "사진";
const MAX_UNREAD_COUNT = 99;

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
        {count > MAX_UNREAD_COUNT ? `${MAX_UNREAD_COUNT}+` : count}
      </Text>
    </XStack>
  );
}

export function ChatRow({ room }: { room: ChatRoomResponse }) {
  return (
    <XStack
      gap="$3"
      items="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={() => pushOnce(`/chat/${room.roomId}`)}
    >
      <UserAvatar id={String(room.memberId)} url={room.profileImageUrl} />

      <YStack flex={1} gap="$2">
        <XStack items="center" justify="space-between" gap="$2">
          <Text flex={1} numberOfLines={1} fontSize="$4" fontWeight="600">
            {room.nickname}
          </Text>

          <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
            {formatChatTime(room.lastMessageAt)}
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
            {room.lastMessageType === "PHOTO"
              ? PHOTO_MESSAGE
              : room.lastMessageContent}
          </Text>

          <UnreadBadge count={room.unreadCount} />
        </XStack>
      </YStack>
    </XStack>
  );
}
