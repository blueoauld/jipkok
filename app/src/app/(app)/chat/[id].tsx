import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import type { ImagePickerAsset } from "expo-image-picker";
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
import type { FlatList, TextInput } from "react-native";
import {
  GiftedChat,
  type IMessage,
  Message,
  type ReplyMessage,
} from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ChatBubble, displayMinute } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import {
  ChatActions,
  ChatComposer,
  ChatInputToolbar,
  ChatReplyPreview,
  ChatSend,
} from "@/components/ChatInput";
import { ChatMessageReply } from "@/components/ChatMessageReply";
import { ChatSwipeReplyAction } from "@/components/ChatSwipeReplyAction";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import { UserAvatar } from "@/components/UserAvatar";
import { chatMessagesKey, useChatMessages } from "@/hooks/useChatMessages";
import { chatRoomKey, useChatRoom } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useMyProfile } from "@/hooks/useMyProfile";
import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { apiErrorMessage } from "@/lib/alert";
import {
  api,
  type ChatMessageResponse,
  type ChatRoomResponse,
  type ReplyMessageResponse,
} from "@/lib/api";
import { useDeletedRoomStore } from "@/lib/chat/store";
import { PRESS_OPACITY } from "@/lib/design";
import { uploadChatPhoto } from "@/lib/photo";
import { dismissRoomNotifications } from "@/lib/push/notifications";
import { maybeRequestReview } from "@/lib/review/store";
import { pushOnce } from "@/lib/router";

const AVATAR_SIZE = 36;

// 아래 간격을 2로 통일해야 스와이프 답장 아이콘이 버블 중앙에 온다.
const MESSAGE_GAP_BOTTOM = 2;
const GROUP_GAP_TOP = 8;

// 기본 70%면 아바타 + 사진 200 + 시간이 안 들어가서 시간이 사진을 덮는다.
const BUBBLE_MAX_WIDTH = "88%" as const;

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
  const headerHeight = useHeaderHeight();

  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyMessageResponse | null>(
    null,
  );

  const textInputRef = useRef<TextInput>(null!);
  const messagesContainerRef = useRef<FlatList<IMessage>>(null!);
  const { alertElement, confirm, show, showApiError } = useRetroAlert();

  const isFocused = useIsFocused();
  const deletedRoomId = useDeletedRoomStore((state) => state.roomId);
  const clearDeletedRoom = useDeletedRoomStore((state) => state.clear);
  const partnerLeft = deletedRoomId === roomId;

  const { data: profile } = useMyProfile();
  const { data: room, error: roomError } = useChatRoom(roomId, !partnerLeft);
  const { messages, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useChatMessages(roomId);

  const { mutate: sendMessage } = useMutation({
    mutationFn: ({
      content,
      replyToMessageId,
    }: {
      content: string;
      replyToMessageId: number | null;
    }) => api.chats.send(roomId, { type: "TEXT", content, replyToMessageId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatMessagesKey(roomId) }),
    onError: showApiError,
  });

  const { mutate: sendPhotos, isPending: uploading } = useMutation({
    mutationFn: async (assets: ImagePickerAsset[]) => {
      for (const asset of assets) {
        const objectKey = await uploadChatPhoto(asset);
        await api.chats.send(roomId, { type: "PHOTO", objectKey });
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: chatMessagesKey(roomId) }),
    onError: showApiError,
  });

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

  const giftedMessages = useMemo(
    () => (room ? (messages ?? []).map((it) => toGiftedMessage(it, room)) : []),
    [messages, room],
  );

  const replyPreview = useMemo(
    () => (replyTarget ? toGiftedReply(replyTarget) : null),
    [replyTarget],
  );

  const onSend = useCallback(
    (sent: IMessage[]) => {
      const text = sent[0]?.text.trim();

      if (text) {
        sentCountRef.current += 1;
        sendMessage({
          content: text,
          replyToMessageId: replyTarget?.messageId ?? null,
        });
        setReplyTarget(null);
      }
    },
    [sendMessage, replyTarget],
  );

  const handleSwipeReply = useCallback(
    (message: IMessage) => {
      const source = (messages ?? []).find(
        (it) => it.messageId === message._id,
      );

      if (!source) {
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setReplyTarget({
        messageId: source.messageId,
        senderId: source.senderId,
        type: source.type,
        content: source.content ?? null,
        imageUrl: source.imageUrl ?? null,
      });
      textInputRef.current?.focus();
    },
    [messages],
  );

  const handlePressReply = useCallback(
    (reply: ReplyMessage) => {
      const index = (messages ?? []).findIndex(
        (it) => it.messageId === reply._id,
      );

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
    [messages],
  );

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
        <GiftedChat
          messages={giftedMessages}
          onSend={onSend}
          user={{ _id: profile.memberId }}
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
                  replyProps.replyMessage.user._id === room.memberId
                    ? room.nickname
                    : "나"
                }
              />
            ),
            swipe: {
              isEnabled: true,
              onSwipe: handleSwipeReply,
              renderAction: () => <ChatSwipeReplyAction />,
            },
          }}
          isAvatarOnTop
          isAvatarVisibleForEveryMessage
          isDayAnimationEnabled={false}
          renderDay={(props) => <ChatDay {...props} />}
          renderMessage={(props) => {
            const { currentMessage, previousMessage } = props;
            const grouped =
              !!previousMessage?.createdAt &&
              previousMessage.user._id === currentMessage.user._id &&
              displayMinute(previousMessage.createdAt) ===
                displayMinute(currentMessage.createdAt);
            const style = {
              marginTop: grouped ? 0 : GROUP_GAP_TOP,
              marginBottom: MESSAGE_GAP_BOTTOM,
              maxWidth: BUBBLE_MAX_WIDTH,
            };

            return (
              <Message
                {...props}
                containerStyle={{ left: style, right: style }}
              />
            );
          }}
          renderBubble={(props) => (
            <ChatBubble {...props} onPressPhoto={setViewerUrl} />
          )}
          renderAvatar={({ currentMessage, previousMessage }) => {
            const grouped =
              !!previousMessage?.createdAt &&
              previousMessage.user._id === currentMessage.user._id &&
              displayMinute(previousMessage.createdAt) ===
                displayMinute(currentMessage.createdAt);

            if (grouped) {
              return <YStack width={AVATAR_SIZE} />;
            }

            return (
              <YStack
                pressStyle={{ opacity: PRESS_OPACITY }}
                onPress={() => pushOnce(`/member/${room.memberId}`)}
              >
                <UserAvatar
                  id={String(room.memberId)}
                  url={room.profileImageUrl}
                  size={AVATAR_SIZE}
                />
              </YStack>
            );
          }}
          keyboardAvoidingViewProps={{
            behavior: "padding",
            keyboardVerticalOffset: headerHeight,
          }}
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
          textInputProps={{ placeholder: "메시지 입력", maxLength: 1000 }}
          renderInputToolbar={(props) => <ChatInputToolbar {...props} />}
          renderComposer={(props) => <ChatComposer {...props} />}
          renderSend={(props) => <ChatSend {...props} />}
          renderActions={() => (
            <ChatActions uploading={uploading} onPress={handlePickPhotos} />
          )}
        />
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
