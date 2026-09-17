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

import { Badge } from "@/components/ui/Badge";
import { ListRow } from "@/components/ui/ListRow";
import { UserAvatar } from "@/components/UserAvatar";
import type { ChatRoomResponse } from "@/lib/api";
import { formatUnreadCount, mediaSummary } from "@/lib/chat";
import { formatChatTime } from "@/lib/date";
import {
  LIST_ROW_EVEN_PADDING_Y,
  LIST_ROW_LEFT_GAP,
  LIST_ROW_PADDING_X,
  MIN_TAP_SIZE,
  PILL_RADIUS,
} from "@/lib/design";
import { pushOnce } from "@/lib/router";

const STATUS_ICON_SIZE = 14;

const ACTION_SIZE = MIN_TAP_SIZE;
const ACTION_ICON_SIZE = 22;
const ACTION_GAP = 8;
const ACTION_FRICTION = 2;

// TDS Checkbox 원형에서 잰 값이다. 안 고르면 grey300 테두리만, 고르면 blue500 채움에 흰 체크다.
const SELECT_BOX_SIZE = 22;
const SELECT_BORDER_WIDTH = 2;
const SELECT_ICON_SIZE = 14;

function UnreadBadge({ count }: { count: number }) {
  return <Badge>{formatUnreadCount(count)}</Badge>;
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
  const theme = useTheme();

  return (
    <Pressable onPress={onPress}>
      <XStack
        width={ACTION_SIZE}
        height={ACTION_SIZE}
        rounded={PILL_RADIUS}
        bg={bg}
        items="center"
        justify="center"
      >
        <Icon
          size={ACTION_ICON_SIZE}
          weight={weight}
          color={theme.onFill.val}
        />
      </XStack>
    </Pressable>
  );
}

function SelectBox({ selected }: { selected: boolean }) {
  const theme = useTheme();

  return (
    <XStack
      shrink={0}
      width={SELECT_BOX_SIZE}
      height={SELECT_BOX_SIZE}
      rounded={PILL_RADIUS}
      borderWidth={selected ? 0 : SELECT_BORDER_WIDTH}
      borderColor="$grey300"
      bg={selected ? "$blue500" : "transparent"}
      items="center"
      justify="center"
    >
      {selected && (
        <CheckIcon
          size={SELECT_ICON_SIZE}
          weight="bold"
          color={theme.onFill.val}
        />
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
  const swipeable = useRef<SwipeableMethods>(null);
  const avatar = (
    <UserAvatar id={String(room.memberId)} url={room.profileImageUrl} />
  );

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      enabled={!selectable}
      friction={ACTION_FRICTION}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <XStack self="center" pl={LIST_ROW_PADDING_X.small} gap={ACTION_GAP}>
          <SwipeAction
            icon={CheckIcon}
            weight="bold"
            bg="$blue500"
            onPress={() => {
              swipeable.current?.close();
              onMarkRead(room);
            }}
          />
          <SwipeAction
            icon={room.notificationEnabled ? BellSlashIcon : BellIcon}
            bg="$blue500"
            onPress={() => {
              swipeable.current?.close();
              onToggleNotification(room);
            }}
          />
          <SwipeAction
            icon={room.pinned ? PushPinSlashIcon : PushPinIcon}
            bg="$blue500"
            onPress={() => {
              swipeable.current?.close();
              onTogglePin(room);
            }}
          />
        </XStack>
      )}
      renderRightActions={() => (
        <XStack self="center" pr={LIST_ROW_PADDING_X.small}>
          <SwipeAction
            icon={SignOutIcon}
            bg="$red500"
            onPress={() => {
              swipeable.current?.close();
              onLeave(room);
            }}
          />
        </XStack>
      )}
    >
      {/* 밀어서 드러나는 버튼이 닫힌 행 뒤로 비치지 않게 면을 깐다. */}
      <YStack bg="$background">
        <ListRow
          horizontalPadding="small"
          verticalPadding={LIST_ROW_EVEN_PADDING_Y}
          left={
            selectable ? (
              <XStack items="center" gap={LIST_ROW_LEFT_GAP}>
                <SelectBox selected={selected} />
                {avatar}
              </XStack>
            ) : (
              avatar
            )
          }
          onPress={() =>
            selectable ? onSelect?.(room) : pushOnce(`/chat/${room.roomId}`)
          }
        >
          <XStack items="center" justify="space-between" gap="$2">
            <XStack flex={1} items="center" gap="$1.5">
              <Text
                shrink={0}
                fontSize="$4"
                lineHeight="$4"
                fontWeight="500"
                color="$grey800"
              >
                {room.nickname}
              </Text>

              {room.pinned && (
                <PushPinIcon
                  size={STATUS_ICON_SIZE}
                  weight="fill"
                  color={theme.grey400.val}
                />
              )}

              {!room.notificationEnabled && (
                <BellSlashIcon
                  size={STATUS_ICON_SIZE}
                  weight="fill"
                  color={theme.grey400.val}
                />
              )}

              {room.memo && (
                <Text
                  shrink={1}
                  numberOfLines={1}
                  fontSize="$2"
                  lineHeight="$2"
                  color="$grey600"
                >
                  {room.memo}
                </Text>
              )}
            </XStack>

            <Text shrink={0} fontSize="$1" color="$grey500">
              {formatChatTime(room.lastMessageAt)}
            </Text>
          </XStack>

          {/* 한 줄로 두어 행 높이가 사진 높이로 같아지고, 사진 사이가 늘 좌우 여백과 같다. */}
          <XStack items="center" justify="space-between" gap="$2">
            <Text
              flex={1}
              numberOfLines={1}
              fontSize="$2"
              lineHeight="$2"
              color="$grey600"
            >
              {room.lastMessageType === "TEXT"
                ? room.lastMessageContent
                : mediaSummary(room.lastMessageType)}
            </Text>

            {room.unreadCount > 0 && <UnreadBadge count={room.unreadCount} />}
          </XStack>
        </ListRow>
      </YStack>
    </ReanimatedSwipeable>
  );
}

export const ChatRoomRow = memo(Row);
