import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, type ListRenderItem } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Spinner, XStack, YStack } from "tamagui";

import { CHAT_BUBBLE_MIN_HEIGHT, ChatBubble } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import {
  ChatScrollToBottom,
  useScrollToBottomVisible,
} from "@/components/ChatScrollToBottom";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import { SCROLL_EVENT_THROTTLE } from "@/components/ScrollToTopButton";
import { UserAvatar } from "@/components/UserAvatar";
import { chatMessagesKey, useChatMessages } from "@/hooks/useChatMessages";
import { chatRoomKey, useChatRoom } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api, type ChatMessageResponse } from "@/lib/api";
import { isSameDay } from "@/lib/date";
import { PRESS_OPACITY } from "@/lib/design";
import { pushOnce } from "@/lib/router";

const AVATAR_SIZE = CHAT_BUBBLE_MIN_HEIGHT;
const AVATAR_GAP = 8;

const BUBBLE_MAX_WIDTH = "88%";

const GROUP_GAP = 2;
const MESSAGE_GAP = 10;

const LEAVE_DESCRIPTION =
  "나가면 주고받은 대화 내역이 서로에게서 모두 사라집니다.";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const sideMargin = getTokens().space.$3.val;

  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const { alertElement, confirm, showApiError } = useRetroAlert();

  const listRef = useRef<FlatList<ChatMessageResponse>>(null);
  const { visible, onScroll } = useScrollToBottomVisible();

  const { data: profile } = useMyProfile();
  const { data: room } = useChatRoom(roomId, true);
  const { messages, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useChatMessages(roomId);

  const leave = useMutation({
    mutationFn: () => api.chats.leave(roomId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      router.back();
    },
    onError: showApiError,
  });

  const myId = profile?.memberId;
  const partnerId = room?.memberId;
  const partnerImageUrl = room?.profileImageUrl;

  const renderItem: ListRenderItem<ChatMessageResponse> = useCallback(
    ({ item, index }) => {
      const older = messages?.[index + 1];
      const itemDate = new Date(item.createdAt);
      const sameGroupAsOlder =
        !!older &&
        older.senderId === item.senderId &&
        isSameDay(new Date(older.createdAt), itemDate);
      const showDay = !older || !isSameDay(new Date(older.createdAt), itemDate);
      const mine = item.senderId === myId;

      return (
        // inverted 목록이라 위(과거) 방향 간격은 marginTop으로 붙는다.
        <YStack mt={sameGroupAsOlder ? GROUP_GAP : MESSAGE_GAP}>
          {showDay && <ChatDay createdAt={item.createdAt} />}

          {mine ? (
            <XStack justify="flex-end" mr={sideMargin}>
              <XStack shrink={1} maxW={BUBBLE_MAX_WIDTH}>
                <ChatBubble message={item} mine onPressPhoto={setViewerUrl} />
              </XStack>
            </XStack>
          ) : (
            <XStack ml={sideMargin} gap={AVATAR_GAP}>
              {sameGroupAsOlder ? (
                <YStack width={AVATAR_SIZE} />
              ) : (
                <YStack
                  pressStyle={{ opacity: PRESS_OPACITY }}
                  onPress={() => pushOnce(`/member/${item.senderId}`)}
                >
                  <UserAvatar
                    id={String(item.senderId)}
                    url={item.senderId === partnerId ? partnerImageUrl : null}
                    size={AVATAR_SIZE}
                  />
                </YStack>
              )}

              <XStack shrink={1} maxW={BUBBLE_MAX_WIDTH}>
                <ChatBubble
                  message={item}
                  mine={false}
                  onPressPhoto={setViewerUrl}
                />
              </XStack>
            </XStack>
          )}
        </YStack>
      );
    },
    [messages, myId, partnerId, partnerImageUrl, sideMargin],
  );

  const loadOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const openMenu = useCallback(() => setMenuOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      title: room?.nickname ?? "",
      headerRight: () => (
        <HeaderCircleIconButton
          icon={DotsThreeIcon}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [room?.nickname, openMenu],
  );

  const menuItems: MenuSheetItem[] = [
    {
      label: "프로필",
      onPress: () => {
        if (room) {
          pushOnce(`/member/${room.memberId}`);
        }
      },
    },
    {
      label: "나가기",
      onPress: () =>
        confirm({
          message: LEAVE_DESCRIPTION,
          confirmLabel: "나가기",
          destructive: true,
          onConfirm: () => leave.mutate(),
        }),
    },
    {
      label: "신고하기",
      destructive: true,
      onPress: () => {
        if (room) {
          pushOnce(`/report/${room.memberId}?roomId=${roomId}`);
        }
      },
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {room && profile ? (
        <YStack flex={1}>
          <FlatList
            ref={listRef}
            inverted
            data={messages ?? []}
            keyExtractor={(item) =>
              item.clientMessageId ?? String(item.messageId)
            }
            renderItem={renderItem}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <YStack items="center" py="$4">
                  <Spinner size="small" />
                </YStack>
              ) : null
            }
            onScroll={onScroll}
            scrollEventThrottle={SCROLL_EVENT_THROTTLE}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 100,
            }}
            contentContainerStyle={{ paddingVertical: sideMargin }}
          />

          <ChatScrollToBottom
            visible={visible}
            onPress={() =>
              listRef.current?.scrollToOffset({ offset: 0, animated: true })
            }
          />
        </YStack>
      ) : (
        <YStack flex={1} justify="center" items="center">
          <Spinner size="small" />
        </YStack>
      )}

      <PhotoViewer
        photos={viewerUrl ? [viewerUrl] : []}
        initialIndex={0}
        open={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
      />

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />

      {alertElement}
    </SafeAreaView>
  );
}
