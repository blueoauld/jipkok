import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { BellSlashIcon } from "phosphor-react-native/src/icons/BellSlash";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { useRef } from "react";
import { Pressable } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { RetroCard } from "@/components/ui/RetroCard";
import { UserAvatar } from "@/components/UserAvatar";
import { chatMessagesKey } from "@/hooks/useChatMessages";
import { chatRoomKey } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type ChatRoomPage, type ChatRoomResponse } from "@/lib/api";
import { formatUnreadCount, LEAVE_DESCRIPTION } from "@/lib/chat";
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

export function ChatRoomRow({ room }: { room: ChatRoomResponse }) {
  const theme = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);
  const queryClient = useQueryClient();
  const { alertElement, confirm, showApiError } = useRetroAlert();

  const apply = (enabled: boolean) =>
    queryClient.setQueriesData<InfiniteData<ChatRoomPage>>(
      { queryKey: CHAT_ROOMS_KEY },
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.roomId === room.roomId
                ? { ...item, notificationEnabled: enabled }
                : item,
            ),
          })),
        },
    );

  const toggle = useMutation({
    mutationFn: (enabled: boolean) =>
      api.chats.updateNotification(room.roomId, enabled),
    onMutate: apply,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatRoomKey(room.roomId) }),
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      showApiError(error);
    },
  });

  const leave = useMutation({
    mutationFn: () => api.chats.leave(room.roomId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: chatRoomKey(room.roomId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(room.roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_COUNT_KEY });
    },
    onError: showApiError,
  });

  return (
    <>
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggle.mutate(!room.notificationEnabled);
              }}
            />
          )}
          renderRightActions={() => (
            <LeaveAction
              onPress={() => {
                swipeable.current?.close();
                confirm({
                  message: LEAVE_DESCRIPTION,
                  confirmLabel: "나가기",
                  destructive: true,
                  onConfirm: () => leave.mutate(),
                });
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

      {alertElement}
    </>
  );
}
