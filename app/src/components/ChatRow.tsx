import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { BellIcon, BellSlashIcon, SignOutIcon } from "phosphor-react-native";
import { useRef } from "react";
import { StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { UserAvatar } from "@/components/UserAvatar";
import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { alertApiError, confirmAlert } from "@/lib/alert";
import { api, type ChatRoomPage, type ChatRoomResponse } from "@/lib/api";
import { formatUnreadCount } from "@/lib/chat/unread";
import { formatChatTime } from "@/lib/date";
import { PRESS_OPACITY } from "@/lib/design";
import { pushOnce } from "@/lib/router";

const PHOTO_MESSAGE = "사진";

const LEAVE_ACTION_WIDTH = 56;
const LEAVE_ACTION_GAP = 12;
const LEAVE_ICON_SIZE = 24;
const LEAVE_DESCRIPTION =
  "나가면 주고받은 대화 내역이 서로에게서 모두 사라집니다.";

// 스와이프 액션은 투명한 반대쪽 컨테이너에 덮여 있어, 일반 프레서블은
// 안드로이드에서 탭을 받지 못한다. 제스처 시스템에 직접 등록되는
// 제스처 핸들러의 Pressable을 쓴다.
function LeaveAction({
  drag,
  onPress,
}: {
  drag: SharedValue<number>;
  onPress: () => void;
}) {
  const theme = useTheme();

  const slideIn = useAnimatedStyle(() => ({
    transform: [
      { translateX: drag.value + LEAVE_ACTION_WIDTH + LEAVE_ACTION_GAP },
    ],
  }));

  return (
    <Animated.View style={[slideIn, styles.action]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          {
            marginLeft: LEAVE_ACTION_GAP,
            backgroundColor: theme.red10.val,
            opacity: pressed ? PRESS_OPACITY : 1,
          },
        ]}
      >
        <SignOutIcon size={LEAVE_ICON_SIZE} weight="fill" color="white" />
      </Pressable>
    </Animated.View>
  );
}

function NotificationAction({
  enabled,
  drag,
  onPress,
}: {
  enabled: boolean;
  drag: SharedValue<number>;
  onPress: () => void;
}) {
  const theme = useTheme();

  const slideIn = useAnimatedStyle(() => ({
    transform: [
      { translateX: drag.value - LEAVE_ACTION_WIDTH - LEAVE_ACTION_GAP },
    ],
  }));

  return (
    <Animated.View style={[slideIn, styles.action]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          {
            marginRight: LEAVE_ACTION_GAP,
            backgroundColor: theme.blue10.val,
            opacity: pressed ? PRESS_OPACITY : 1,
          },
        ]}
      >
        {enabled ? (
          <BellSlashIcon size={LEAVE_ICON_SIZE} weight="fill" color="white" />
        ) : (
          <BellIcon size={LEAVE_ICON_SIZE} weight="fill" color="white" />
        )}
      </Pressable>
    </Animated.View>
  );
}

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
        {formatUnreadCount(count)}
      </Text>
    </XStack>
  );
}

export function ChatRow({ room }: { room: ChatRoomResponse }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const swipeable = useRef<SwipeableMethods>(null);

  const leave = useMutation({
    mutationFn: () => api.chats.leave(room.roomId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: chatRoomKey(room.roomId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(room.roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
    },
    onError: alertApiError,
  });

  const applyNotification = (enabled: boolean) =>
    queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
      { queryKey: CHAT_ROOMS_KEY },
      (current) =>
        current?.pages
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.roomId === room.roomId
                    ? { ...item, notificationEnabled: enabled }
                    : item,
                ),
              })),
            }
          : current,
    );

  const toggleNotification = useMutation({
    mutationFn: (enabled: boolean) =>
      api.chats.updateNotification(room.roomId, enabled),
    onMutate: applyNotification,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatRoomKey(room.roomId) }),
    onError: (error, enabled) => {
      applyNotification(!enabled);
      alertApiError(error);
    },
  });

  const toggle = () => {
    swipeable.current?.close();

    if (!toggleNotification.isPending) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleNotification.mutate(!room.notificationEnabled);
    }
  };

  const confirmLeave = () => {
    swipeable.current?.close();
    confirmAlert({
      title: "채팅",
      message: LEAVE_DESCRIPTION,
      confirmLabel: "나가기",
      onConfirm: () => leave.mutate(),
    });
  };

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
      renderRightActions={(_progress, drag) => (
        <LeaveAction drag={drag} onPress={confirmLeave} />
      )}
      renderLeftActions={(_progress, drag) => (
        <NotificationAction
          enabled={room.notificationEnabled}
          drag={drag}
          onPress={toggle}
        />
      )}
    >
      <XStack
        gap="$3"
        items="center"
        pressStyle={{ opacity: PRESS_OPACITY }}
        onPress={() => pushOnce(`/chat/${room.roomId}`)}
      >
        <UserAvatar id={String(room.memberId)} url={room.profileImageUrl} />

        <YStack flex={1} gap="$2">
          <XStack items="center" justify="space-between" gap="$2">
            <XStack flex={1} items="center" gap="$1.5">
              <Text shrink={1} numberOfLines={1} fontSize="$4" fontWeight="600">
                {room.nickname}
              </Text>

              {!room.notificationEnabled && (
                <BellSlashIcon
                  size={14}
                  weight="fill"
                  color={theme.gray9.val}
                />
              )}
            </XStack>

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
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: "center",
  },
  actionButton: {
    width: LEAVE_ACTION_WIDTH,
    height: LEAVE_ACTION_WIDTH,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
});
