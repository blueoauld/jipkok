import { BellSlashIcon } from "phosphor-react-native/src/icons/BellSlash";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatRoomResponse } from "@/lib/api";
import { formatUnreadCount } from "@/lib/chat";
import { formatChatTime } from "@/lib/date";
import { pushOnce } from "@/lib/router";

const PHOTO_MESSAGE = "사진";

const MUTE_ICON_SIZE = 14;

const BADGE_SIZE = 20;
const BADGE_FONT_SIZE = 11;

function UnreadBadge({ count }: { count: number }) {
  return (
    <XStack
      shrink={0}
      minW={BADGE_SIZE}
      height={BADGE_SIZE}
      px="$1.5"
      borderWidth={2}
      borderColor="$color12"
      bg="$red10"
      items="center"
      justify="center"
    >
      <Text color="white" fontSize={BADGE_FONT_SIZE} fontWeight="700">
        {formatUnreadCount(count)}
      </Text>
    </XStack>
  );
}

export function ChatRoomRow({ room }: { room: ChatRoomResponse }) {
  const theme = useTheme();

  return (
    <RetroCard onPress={() => pushOnce(`/chat/${room.roomId}`)}>
      <XStack gap="$3" items="center">
        <UserAvatar id={String(room.memberId)} url={room.profileImageUrl} />

        <YStack flex={1} gap="$2">
          <XStack items="center" justify="space-between" gap="$2">
            <XStack flex={1} items="center" gap="$1.5">
              <Text shrink={1} numberOfLines={1} fontSize="$4" fontWeight="600">
                {room.nickname}
              </Text>

              {!room.notificationEnabled && (
                <BellSlashIcon
                  size={MUTE_ICON_SIZE}
                  weight="fill"
                  color={theme.gray9.val}
                />
              )}
            </XStack>

            <Text shrink={0} fontSize="$2">
              {formatChatTime(room.lastMessageAt)}
            </Text>
          </XStack>

          <XStack items="center" justify="space-between" gap="$2">
            <Text flex={1} numberOfLines={2} fontSize="$3">
              {room.lastMessageType === "PHOTO"
                ? PHOTO_MESSAGE
                : room.lastMessageContent}
            </Text>

            {room.unreadCount > 0 && <UnreadBadge count={room.unreadCount} />}
          </XStack>
        </YStack>
      </XStack>
    </RetroCard>
  );
}
