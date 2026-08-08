import "dayjs/locale/ko";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, Stack, useIsFocused, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type FlatList, type TextInput, useColorScheme } from "react-native";
import {
  GiftedChat,
  type IMessage,
  type ReplyMessage,
} from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ChatBubble } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import {
  ChatActions,
  ChatComposer,
  ChatInputToolbar,
  ChatSend,
} from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatMessageReply } from "@/components/ChatMessageReply";
import { ChatReplyPreview } from "@/components/ChatReplyPreview";
import {
  CHAT_SCROLL_TO_BOTTOM_CONTENT_STYLE,
  CHAT_SCROLL_TO_BOTTOM_STYLE,
  ChatScrollToBottom,
} from "@/components/ChatScrollToBottom";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { chatMessagesKey, useChatMessages } from "@/hooks/useChatMessages";
import { chatRoomKey, useChatRoom } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useMyProfile } from "@/hooks/useMyProfile";
import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { useSendMessage } from "@/hooks/useSendMessage";
import { alertApiError, alertInfo, confirmAlert } from "@/lib/alert";
import {
  api,
  type ChatMessageResponse,
  type ChatRoomResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { useDeletedRoomStore } from "@/lib/chat/store";
import { dismissRoomNotifications } from "@/lib/push/notifications";
import { maybeRequestReview } from "@/lib/review/store";
import { pushOnce } from "@/lib/router";

const MESSAGE_MAX_LENGTH = 1000;

const REVIEW_SENT_THRESHOLD = 5;

const PARTNER_LEFT_MESSAGE = "상대가 채팅방을 나갔습니다.";

const LEAVE_DESCRIPTION =
  "나가면 주고받은 대화 내역이 서로에게서 모두 사라집니다.";

function toGiftedMessage(
  message: ChatMessageResponse,
  room: ChatRoomResponse,
): IMessage {
  return {
    _id: message.messageId,
    text: message.content ?? "",
    createdAt: new Date(message.createdAt),
    user:
      message.senderId === room.memberId
        ? {
            _id: room.memberId,
            name: room.nickname,
            avatar: room.profileImageUrl ?? undefined,
          }
        : { _id: message.senderId },
    image: message.imageUrl ?? undefined,
    replyMessage: message.replyMessage
      ? toGiftedReply(message.replyMessage)
      : undefined,
    // 자리표시자는 음수 id를 쓴다.
    pending: message.messageId < 0,
  };
}

function toGiftedReply(reply: ReplyMessageResponse): ReplyMessage {
  return {
    _id: reply.messageId,
    text: reply.content ?? "",
    user: { _id: reply.senderId },
    image: reply.imageUrl ?? undefined,
  };
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);

  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const headerHeight = useHeaderHeight();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  const [menuOpen, setMenuOpen] = useState(false);

  const { data: profile } = useMyProfile();
  const deletedRoomId = useDeletedRoomStore((state) => state.roomId);
  const clearDeletedRoom = useDeletedRoomStore((state) => state.clear);
  const partnerLeft = deletedRoomId === roomId;

  const { data: room, error: roomError } = useChatRoom(roomId, !partnerLeft);
  const feed = useChatMessages(roomId);
  const markRead = useMutation({
    mutationFn: (lastReadMessageId: number) =>
      api.chats.markRead(roomId, lastReadMessageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatRoomKey(roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
    },
  });

  const leave = useMutation({
    mutationFn: () => api.chats.leave(roomId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: chatRoomKey(roomId) });
      queryClient.removeQueries({ queryKey: chatMessagesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      router.back();
    },
    onError: alertApiError,
  });

  const { sendText, sendPhotos, uploading } = useSendMessage(
    roomId,
    profile?.memberId ?? 0,
  );
  const { messages, isFetchingNextPage, hasNextPage, fetchNextPage } = feed;

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
      alertInfo(PARTNER_LEFT_MESSAGE);
    } else {
      alertApiError(roomError);
    }

    router.back();
  }, [clearDeletedRoom, isFocused, partnerLeft, roomError]);

  // 자리표시자는 음수 id라 서버에 보낼 수 없다.
  const newestMessageId = messages?.[0]?.messageId ?? 0;
  const unreadCount = room?.unreadCount ?? 0;
  const markReadMutate = markRead.mutate;

  useEffect(() => {
    if (unreadCount > 0 && newestMessageId > 0) {
      markReadMutate(newestMessageId);
    }
  }, [markReadMutate, newestMessageId, unreadCount]);

  useEffect(() => {
    dismissRoomNotifications(roomId).catch(() => undefined);
  }, [newestMessageId, roomId]);

  const [replyTarget, setReplyTarget] = useState<ReplyMessageResponse | null>(
    null,
  );
  const replyPreview = useMemo(
    () => (replyTarget ? toGiftedReply(replyTarget) : null),
    [replyTarget],
  );

  const giftedMessages = useMemo(
    () => (room ? (messages ?? []).map((it) => toGiftedMessage(it, room)) : []),
    [messages, room],
  );

  const textInputRef = useRef<TextInput>(null!);
  const sentCountRef = useRef(0);

  // 대화가 이어진 방에서 나올 때가 평점을 부탁하기 좋은 순간이다.
  useEffect(
    () => () => {
      if (sentCountRef.current >= REVIEW_SENT_THRESHOLD) {
        maybeRequestReview();
      }
    },
    [],
  );
  const messagesContainerRef = useRef<FlatList<IMessage>>(null!);

  const handlePressReply = useCallback(
    (reply: ReplyMessage) => {
      const index = giftedMessages.findIndex((it) => it._id === reply._id);

      if (index < 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      messagesContainerRef.current?.scrollToIndex({
        index,
        viewPosition: 0.5,
        animated: true,
      });
    },
    [giftedMessages],
  );

  const handleSwipeReply = useCallback((message: IMessage) => {
    const messageId = Number(message._id);

    // 전송 중인 자리표시자에는 답글을 달 수 없다.
    if (messageId <= 0) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReplyTarget({
      messageId,
      senderId: Number(message.user._id),
      type: message.image ? "PHOTO" : "TEXT",
      content: message.text || null,
      imageUrl: message.image ?? null,
    });
    textInputRef.current?.focus();
  }, []);

  const handleSend = useCallback(
    (sent: IMessage[]) => {
      const text = sent[0]?.text.trim();

      if (text) {
        sentCountRef.current += 1;
        sendText(text, replyTarget);
        setReplyTarget(null);
      }
    },
    [replyTarget, sendText],
  );

  const handlePickPhotos = useCallback(async () => {
    const assets = await pickPhotos(MAX_PHOTOS);

    if (assets.length > 0) {
      sendPhotos(assets);
    }
  }, [sendPhotos]);

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
        confirmAlert({
          title: "채팅",
          message: LEAVE_DESCRIPTION,
          confirmLabel: "나가기",
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
        <GiftedChat
          messages={giftedMessages}
          onSend={handleSend}
          textInputRef={textInputRef}
          messagesContainerRef={
            messagesContainerRef as ComponentProps<
              typeof GiftedChat<IMessage>
            >["messagesContainerRef"]
          }
          listProps={{
            onScrollToIndexFailed: (info) =>
              messagesContainerRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              }),
          }}
          reply={{
            message: replyPreview,
            onClear: () => setReplyTarget(null),
            onPress: handlePressReply,
            renderPreview: (previewProps) => (
              <ChatReplyPreview
                {...previewProps}
                name={
                  replyTarget?.senderId === room.memberId ? room.nickname : "나"
                }
              />
            ),
            renderMessageReply: (replyProps) => (
              <ChatMessageReply
                {...replyProps}
                name={
                  Number(replyProps.replyMessage.user._id) === room.memberId
                    ? room.nickname
                    : "나"
                }
              />
            ),
            swipe: {
              isEnabled: true,
              onSwipe: handleSwipeReply,
            },
          }}
          user={{ _id: profile.memberId }}
          locale="ko"
          colorScheme={scheme}
          isAvatarOnTop
          isDayAnimationEnabled={false}
          isScrollToBottomEnabled
          loadEarlierMessagesProps={{
            isAvailable: hasNextPage,
            isLoading: isFetchingNextPage,
            isInfiniteScrollEnabled: true,
            onPress: fetchNextPage,
          }}
          renderLoadEarlier={({ isLoading }) =>
            isLoading ? (
              <YStack items="center" py="$4">
                <Spinner size="small" />
              </YStack>
            ) : null
          }
          scrollToBottomStyle={CHAT_SCROLL_TO_BOTTOM_STYLE}
          scrollToBottomContentStyle={CHAT_SCROLL_TO_BOTTOM_CONTENT_STYLE}
          scrollToBottomComponent={() => <ChatScrollToBottom />}
          keyboardAvoidingViewProps={{
            behavior: "padding",
            keyboardVerticalOffset: headerHeight,
          }}
          textInputProps={{
            placeholder: "메시지 입력",
            maxLength: MESSAGE_MAX_LENGTH,
          }}
          renderDay={(props) => <ChatDay {...props} />}
          renderMessage={(props) => <ChatMessage {...props} />}
          renderBubble={(props) => <ChatBubble {...props} />}
          renderInputToolbar={(props) => <ChatInputToolbar {...props} />}
          renderComposer={(props) => <ChatComposer {...props} />}
          renderSend={(props) => <ChatSend {...props} />}
          renderActions={(props) => (
            <ChatActions {...props} uploading={uploading} />
          )}
          onPressActionButton={handlePickPhotos}
          onPressAvatar={() => pushOnce(`/member/${room.memberId}`)}
        />
      ) : (
        <YStack flex={1} justify="center" items="center">
          <Spinner size="small" />
        </YStack>
      )}

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />
    </SafeAreaView>
  );
}
