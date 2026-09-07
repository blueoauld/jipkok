import type { Icon, IconWeight } from "phosphor-react-native";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { BellSlashIcon } from "phosphor-react-native/src/icons/BellSlash";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { PushPinIcon } from "phosphor-react-native/src/icons/PushPin";
import { PushPinSlashIcon } from "phosphor-react-native/src/icons/PushPinSlash";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { memo, useRef } from "react";
import { Pressable } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, useTheme, XStack, type XStackProps, YStack } from "tamagui";

import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroCard } from "@/components/ui/RetroCard";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatRoomResponse } from "@/lib/api";
import { formatUnreadCount, mediaSummary } from "@/lib/chat";
import { formatChatTime } from "@/lib/date";
import { RETRO_BORDER_WIDTH, RETRO_SHADOW_OFFSET } from "@/lib/design";
import { pushOnce } from "@/lib/router";
import { useAccentToken } from "@/lib/theme/accent";

const MUTE_ICON_SIZE = 14;
const PIN_ICON_SIZE = 14;

const ACTION_SIZE = 46;
const ACTION_ICON_SIZE = 22;
const ACTION_FRICTION = 2;

const SELECT_BOX_SIZE = 22;
const SELECT_ICON_SIZE = 14;

function UnreadBadge({ count }: { count: number }) {
  return <RetroBadge>{formatUnreadCount(count)}</RetroBadge>;
}

function SwipeAction({
  icon: Icon,
  weight = "fill",
  bg,
  onPress,
}: {
  icon: Icon;
  weight?: IconWeight;
  bg: XStackProps["bg"];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <XStack
        width={ACTION_SIZE}
        height={ACTION_SIZE}
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        bg={bg}
        items="center"
        justify="center"
      >
        <Icon size={ACTION_ICON_SIZE} weight={weight} color="white" />
      </XStack>
    </Pressable>
  );
}

function SelectBox({ selected }: { selected: boolean }) {
  const accent = useAccentToken();

  return (
    <XStack
      shrink={0}
      width={SELECT_BOX_SIZE}
      height={SELECT_BOX_SIZE}
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg={selected ? accent : "transparent"}
      items="center"
      justify="center"
    >
      {selected && (
        <CheckIcon size={SELECT_ICON_SIZE} weight="bold" color="white" />
      )}
    </XStack>
  );
}

function Row({
  room,
  selectable = false,
  selected = false,
  onSelect,
  onToggleNotification,
  onTogglePin,
  onMarkRead,
  onLeave,
}: {
  room: ChatRoomResponse;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (room: ChatRoomResponse) => void;
  onToggleNotification: (room: ChatRoomResponse) => void;
  onTogglePin: (room: ChatRoomResponse) => void;
  onMarkRead: (room: ChatRoomResponse) => void;
  onLeave: (room: ChatRoomResponse) => void;
}) {
  const theme = useTheme();
  const accent = useAccentToken();
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <YStack mr={-RETRO_SHADOW_OFFSET} mb={-RETRO_SHADOW_OFFSET}>
      <ReanimatedSwipeable
        ref={swipeable}
        enabled={!selectable}
        friction={ACTION_FRICTION}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={() => (
          <XStack self="center" pr="$3" gap="$2">
            <SwipeAction
              icon={room.notificationEnabled ? BellSlashIcon : BellIcon}
              bg={accent}
              onPress={() => {
                swipeable.current?.close();
                onToggleNotification(room);
              }}
            />
            <SwipeAction
              icon={room.pinned ? PushPinSlashIcon : PushPinIcon}
              bg="$gray10"
              onPress={() => {
                swipeable.current?.close();
                onTogglePin(room);
              }}
            />
          </XStack>
        )}
        renderRightActions={() => (
          <XStack self="center" pl="$3" gap="$2">
            <SwipeAction
              icon={CheckIcon}
              weight="bold"
              bg="$green10"
              onPress={() => {
                swipeable.current?.close();
                onMarkRead(room);
              }}
            />
            <SwipeAction
              icon={SignOutIcon}
              bg="$red10"
              onPress={() => {
                swipeable.current?.close();
                onLeave(room);
              }}
            />
          </XStack>
        )}
      >
        <YStack pr={RETRO_SHADOW_OFFSET} pb={RETRO_SHADOW_OFFSET}>
          <RetroCard
            onPress={() =>
              selectable ? onSelect?.(room) : pushOnce(`/chat/${room.roomId}`)
            }
          >
            <XStack gap="$3" items="center">
              {selectable && <SelectBox selected={selected} />}

              <UserAvatar
                id={String(room.memberId)}
                url={room.profileImageUrl}
              />

              <YStack flex={1} gap="$2">
                <XStack items="center" justify="space-between" gap="$2">
                  <XStack flex={1} items="center" gap="$1.5">
                    <Text shrink={0} fontSize="$4" fontWeight="600">
                      {room.nickname}
                    </Text>

                    {room.pinned && (
                      <PushPinIcon
                        size={PIN_ICON_SIZE}
                        weight="fill"
                        color={theme.gray9.val}
                      />
                    )}

                    {!room.notificationEnabled && (
                      <BellSlashIcon
                        size={MUTE_ICON_SIZE}
                        weight="fill"
                        color={theme.gray9.val}
                      />
                    )}

                    {room.memo && (
                      <Text
                        shrink={1}
                        numberOfLines={1}
                        fontSize="$2"
                        color="$color11"
                      >
                        {room.memo}
                      </Text>
                    )}
                  </XStack>

                  <Text theme="gray" shrink={0} fontSize="$2" color="$color11">
                    {formatChatTime(room.lastMessageAt)}
                  </Text>
                </XStack>

                <XStack items="center" justify="space-between" gap="$2">
                  <Text flex={1} numberOfLines={2} fontSize="$3">
                    {room.lastMessageType === "TEXT"
                      ? room.lastMessageContent
                      : mediaSummary(room.lastMessageType)}
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
