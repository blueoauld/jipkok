import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { BellSlashIcon } from "phosphor-react-native/src/icons/BellSlash";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { memo, useRef } from "react";
import { Pressable } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatRoomResponse } from "@/lib/api";
import { formatUnreadCount } from "@/lib/chat";
import { formatChatTime } from "@/lib/date";
import { RETRO_SHADOW_OFFSET } from "@/lib/design";
import { pushOnce } from "@/lib/router";

const PHOTO_MESSAGE = "사진";

const MUTE_ICON_SIZE = 14;

const BADGE_SIZE = 20;
const BADGE_FONT_SIZE = 11;

const ACTION_SIZE = 40;
const ACTION_ICON_SIZE = 20;
const ACTION_FRICTION = 2;

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

function NotificationAction({
  enabled,
  onPress,
}: {
  enabled: boolean;
  onPress: () => void;
}) {
  const Icon = enabled ? BellSlashIcon : BellIcon;

  return (
    <YStack self="center" pr="$3">
      <Pressable onPress={onPress}>
        <XStack
          width={ACTION_SIZE}
          height={ACTION_SIZE}
          borderWidth={2}
          borderColor="$gray12"
          bg="$blue10"
          items="center"
          justify="center"
        >
          <Icon size={ACTION_ICON_SIZE} weight="fill" color="white" />
        </XStack>
      </Pressable>
    </YStack>
  );
}

function LeaveAction({ onPress }: { onPress: () => void }) {
  return (
    <YStack self="center" pl="$3">
      <Pressable onPress={onPress}>
        <XStack
          width={ACTION_SIZE}
          height={ACTION_SIZE}
          borderWidth={2}
          borderColor="$gray12"
          bg="$red10"
          items="center"
          justify="center"
        >
          <SignOutIcon size={ACTION_ICON_SIZE} weight="fill" color="white" />
        </XStack>
      </Pressable>
    </YStack>
  );
}

function Row({
  room,
  onToggleNotification,
  onLeave,
}: {
  room: ChatRoomResponse;
  onToggleNotification: (room: ChatRoomResponse) => void;
  onLeave: (room: ChatRoomResponse) => void;
}) {
  const theme = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <YStack mr={-RETRO_SHADOW_OFFSET} mb={-RETRO_SHADOW_OFFSET}>
      <ReanimatedSwipeable
        ref={swipeable}
        friction={ACTION_FRICTION}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={() => (
          <NotificationAction
            enabled={room.notificationEnabled}
            onPress={() => {
              swipeable.current?.close();
              onToggleNotification(room);
            }}
          />
        )}
        renderRightActions={() => (
          <LeaveAction
            onPress={() => {
              swipeable.current?.close();
              onLeave(room);
            }}
          />
        )}
      >
        <YStack pr={RETRO_SHADOW_OFFSET} pb={RETRO_SHADOW_OFFSET}>
          <RetroCard onPress={() => pushOnce(`/chat/${room.roomId}`)}>
            <XStack gap="$3" items="center">
              <UserAvatar
                id={String(room.memberId)}
                url={room.profileImageUrl}
              />

              <YStack flex={1} gap="$2">
                <XStack items="center" justify="space-between" gap="$2">
                  <XStack flex={1} items="center" gap="$1.5">
                    <Text
                      shrink={1}
                      numberOfLines={1}
                      fontSize="$4"
                      fontWeight="600"
                    >
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

                  {room.unreadCount > 0 && (
                    <UnreadBadge count={room.unreadCount} />
                  )}
                </XStack>
              </YStack>
            </XStack>
          </RetroCard>
        </YStack>
      </ReanimatedSwipeable>
    </YStack>
  );
}

export const ChatRoomRow = memo(Row);
