import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, Stack, useIsFocused, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, type TextInput } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ChatInputBar } from "@/components/ChatInput";
import { ChatMessageRow } from "@/components/ChatMessageRow";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import { chatMessagesKey, useChatMessages } from "@/hooks/useChatMessages";
import { chatRoomKey, useChatRoom } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useMyProfile } from "@/hooks/useMyProfile";
import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useSendMessage } from "@/hooks/useSendMessage";
import { apiErrorMessage } from "@/lib/alert";
import {
  api,
  type ChatMessageResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { useDeletedRoomStore } from "@/lib/chat/store";
import { dismissRoomNotifications } from "@/lib/push/notifications";
import { maybeRequestReview } from "@/lib/review/store";
import { pushOnce } from "@/lib/router";

const REVIEW_SENT_THRESHOLD = 5;

const PARTNER_LEFT_MESSAGE = "상대가 채팅방을 나갔습니다.";

const LEAVE_DESCRIPTION =
  "나가면 주고받은 대화 내역이 서로에게서 모두 사라집니다.";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const headerHeight = useHeaderHeight();

  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyMessageResponse | null>(
    null,
  );

  const textInputRef = useRef<TextInput>(null!);
  const listRef = useRef<FlatList<ChatMessageResponse>>(null!);
  const { alertElement, confirm, show, showApiError } = useRetroAlert();

  const isFocused = useIsFocused();
  const deletedRoomId = useDeletedRoomStore((state) => state.roomId);
  const clearDeletedRoom = useDeletedRoomStore((state) => state.clear);
  const partnerLeft = deletedRoomId === roomId;

  const { data: profile } = useMyProfile();
  const { data: room, error: roomError } = useChatRoom(roomId, !partnerLeft);
  const { messages, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useChatMessages(roomId);

  // 행 콜백이 메시지 배열에 묶이면 배열이 갱신될 때마다 모든 행이 다시 그려진다.
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const { sendText, sendPhotos, uploading } = useSendMessage(
    roomId,
    profile?.memberId ?? 0,
    showApiError,
  );

  const handlePickPhotos = useCallback(async () => {
    const assets = await pickPhotos(MAX_PHOTOS);

    if (assets.length > 0) {
      sendPhotos(assets);
    }
  }, [sendPhotos]);

  // 조건이 여러 번 바뀌어도 알림과 뒤로가기는 한 번만 일어나야 한다.
  // 프로필처럼 위에 떠 있는 화면이 대신 닫히지 않도록 돌아올 때까지 미룬다.
  const leftRef = useRef(false);

  useEffect(() => {
    if (leftRef.current || !isFocused || (!partnerLeft && !roomError)) {
      return;
    }

    leftRef.current = true;

    if (partnerLeft) {
      clearDeletedRoom();
      show("info", PARTNER_LEFT_MESSAGE, () => router.back());
    } else {
      show("error", apiErrorMessage(roomError), () => router.back());
    }
  }, [clearDeletedRoom, isFocused, partnerLeft, roomError, show]);

  // 대화가 이어진 방에서 나올 때가 평점을 부탁하기 좋은 순간이다.
  const sentCountRef = useRef(0);

  useEffect(
    () => () => {
      if (sentCountRef.current >= REVIEW_SENT_THRESHOLD) {
        maybeRequestReview();
      }
    },
    [],
  );

  const { mutate: markRead } = useMutation({
    mutationFn: (lastReadMessageId: number) =>
      api.chats.markRead(roomId, lastReadMessageId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: CHAT_ROOMS_KEY,
        predicate: (query) => query.queryKey[1] !== "messages",
      }),
  });

  const newestMessageId = messages?.[0]?.messageId ?? 0;
  const unreadCount = room?.unreadCount ?? 0;

  useEffect(() => {
    if (unreadCount > 0 && newestMessageId > 0) {
      markRead(newestMessageId);
    }
  }, [markRead, newestMessageId, unreadCount]);

  useEffect(() => {
    dismissRoomNotifications(roomId).catch(() => undefined);
  }, [newestMessageId, roomId]);

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

  const openMenu = useCallback(() => setMenuOpen(true), []);

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

  const handleSendText = useCallback(
    (text: string) => {
      sentCountRef.current += 1;
      sendText(text, replyTarget);
      setReplyTarget(null);
    },
    [sendText, replyTarget],
  );

  const handleSwipeReply = useCallback((message: ChatMessageResponse) => {
    // 전송 중인 자리표시자는 아직 서버 id가 없어 답장 대상이 될 수 없다.
    if (message.messageId < 0) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReplyTarget({
      messageId: message.messageId,
      senderId: message.senderId,
      type: message.type,
      content: message.content ?? null,
      imageUrl: message.imageUrl ?? null,
    });
    textInputRef.current?.focus();
  }, []);

  const handlePressReply = useCallback((reply: ReplyMessageResponse) => {
    const index = (messagesRef.current ?? []).findIndex(
      (it) => it.messageId === reply.messageId,
    );

    if (index < 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    listRef.current?.scrollToIndex({
      index,
      viewPosition: 0.5,
      animated: true,
    });
  }, []);

  const handlePressAvatar = useCallback(() => {
    if (room) {
      pushOnce(`/member/${room.memberId}`);
    }
  }, [room]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: room?.nickname ?? "",
          headerRight: () => (
            <HeaderCircleIconButton
              icon={DotsThreeIcon}
              weight="bold"
              onPress={openMenu}
            />
          ),
        }}
      />

      {room && profile ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={headerHeight}
        >
          <FlatList
            ref={listRef}
            data={messages ?? []}
            inverted
            keyExtractor={(message) =>
              message.clientMessageId ?? String(message.messageId)
            }
            renderItem={({ item, index }) => (
              <ChatMessageRow
                message={item}
                older={messages?.[index + 1]}
                newer={messages?.[index - 1]}
                mine={item.senderId === profile.memberId}
                replyName={
                  item.replyMessage?.senderId === room.memberId
                    ? room.nickname
                    : "나"
                }
                partnerAvatarUrl={room.profileImageUrl ?? null}
                partnerId={room.memberId}
                onPressAvatar={handlePressAvatar}
                onPressPhoto={setViewerUrl}
                onPressReply={handlePressReply}
                onSwipeReply={handleSwipeReply}
              />
            )}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <YStack items="center" py="$4">
                  <Spinner size="small" />
                </YStack>
              ) : null
            }
            onScrollToIndexFailed={(info) =>
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              })
            }
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          <ChatInputBar
            textInputRef={textInputRef}
            uploading={uploading}
            reply={replyTarget}
            replyName={
              replyTarget?.senderId === room.memberId ? room.nickname : "나"
            }
            onClearReply={() => setReplyTarget(null)}
            onPickPhotos={handlePickPhotos}
            onSendText={handleSendText}
          />
        </KeyboardAvoidingView>
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
