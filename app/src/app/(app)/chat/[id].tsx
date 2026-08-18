import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, type ScrollViewProps } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getTokens, Spinner, YStack } from "tamagui";

import type { MessageFrame } from "@/components/chat/ChatBubble";
import { ChatDay } from "@/components/chat/ChatDay";
import {
  ChatInputBar,
  type ChatInputBarHandle,
} from "@/components/chat/ChatInputBar";
import { ChatMessageRow } from "@/components/chat/ChatMessageRow";
import { ChatScrollView } from "@/components/chat/ChatScrollView";
import {
  type MessageAction,
  MessageActionOverlay,
  type MessageActionTarget,
} from "@/components/chat/MessageActionOverlay";
import { VideoPlayerModal } from "@/components/chat/VideoPlayerModal";
import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { invalidateChatLists } from "@/hooks/useChatRooms";
import { forgetRoom } from "@/hooks/useChatSocket";
import { useMyProfile } from "@/hooks/useMyProfile";
import { MAX_PHOTOS, pickChatMedia } from "@/hooks/usePhotos";
import { useReactMessage } from "@/hooks/useReactMessage";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useSendMessage } from "@/hooks/useSendMessage";
import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import {
  api,
  type ChatMessageResponse,
  type ChatReactionType,
  type ReplyMessageResponse,
} from "@/lib/api";
import {
  type ChatRow,
  isPending,
  isRoomNotFound,
  toChatRows,
  toReply,
} from "@/lib/chat";
import { useDeletedRoomStore } from "@/lib/chat/store";
import { PHOTO_PERMISSION_MESSAGE } from "@/lib/message";
import { saveChatMedia } from "@/lib/photo";
import { dismissRoomNotifications } from "@/lib/push/notifications";
import { maybeRequestReview } from "@/lib/review/store";
import { pushOnce } from "@/lib/router";
import { showToast } from "@/lib/toast/store";
import {
  isVideoTooLong,
  VIDEO_TOO_LONG_MESSAGE,
  videoDurationSeconds,
} from "@/lib/video";

const ERROR_MESSAGE = "대화를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "대화 내용이 없습니다.";

const PARTNER_LEFT_MESSAGE = "상대가 채팅방을 나갔습니다.";

const COPIED_MESSAGE = "메시지를 복사했습니다.";

const REPLY_NOT_LOADED_MESSAGE = "원문을 아직 불러오지 못했습니다.";

const PHOTO_SAVED_MESSAGE = "사진을 저장했습니다.";
const PHOTO_SAVE_FAILED_MESSAGE = "사진을 저장하지 못했습니다.";
const VIDEO_SAVED_MESSAGE = "영상을 저장했습니다.";
const VIDEO_SAVE_FAILED_MESSAGE = "영상을 저장하지 못했습니다.";
const VIDEO_URL_FAILED_MESSAGE = "영상을 불러오지 못했습니다.";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const space = getTokens().space;

  const keyboardOffset = useSafeAreaInsets().bottom;

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(
    null,
  );
  const [replyTarget, setReplyTarget] = useState<ChatMessageResponse | null>(
    null,
  );
  const listRef = useRef<FlatList<ChatRow>>(null);
  const inputBarRef = useRef<ChatInputBarHandle>(null);

  const insetTop = useRef(0);

  const scrollToBottom = () =>
    listRef.current?.scrollToOffset({
      offset: -insetTop.current,
      animated: false,
    });

  const queryClient = useQueryClient();
  const { alertElement, confirm, show, showApiError } = useRetroAlert();

  const deletedRoomId = useDeletedRoomStore((state) => state.roomId);
  const clearDeletedRoom = useDeletedRoomStore((state) => state.clear);
  const partnerLeft = deletedRoomId === roomId;

  const handleRoomError = useCallback(
    (error: unknown) => {
      if (isRoomNotFound(error)) {
        forgetRoom(queryClient, roomId);
      } else {
        showApiError(error);
      }
    },
    [queryClient, roomId, showApiError],
  );

  const { data: profile } = useMyProfile();
  const myMemberId = profile?.memberId ?? 0;
  const {
    data: room,
    error: roomError,
    refetch,
  } = useChatRoom(roomId, !partnerLeft);
  const restoreDraft = useCallback(
    (content: string, replyTo: ReplyMessageResponse | null) => {
      inputBarRef.current?.restore(content);

      if (replyTo) {
        const original = messagesRef.current?.find(
          (message) => message.messageId === replyTo.messageId,
        );
        setReplyTarget(original ?? null);
      }
    },
    [],
  );
  const { sendText, sendPhotos, sendVideos, sending, uploading } =
    useSendMessage(roomId, myMemberId, handleRoomError, restoreDraft);
  const { mutate: react } = useReactMessage(
    roomId,
    myMemberId,
    handleRoomError,
  );
  const chatMessages = useChatMessages(roomId, !partnerLeft);
  const { messages, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    chatMessages;

  const partnerId = room?.memberId ?? 0;
  const failure = roomError ?? error;

  useEffect(() => {
    if (isRoomNotFound(failure)) {
      forgetRoom(queryClient, roomId);
    }
  }, [failure, queryClient, roomId]);
  const rows = useMemo(
    () => (messages ? toChatRows(messages) : []),
    [messages],
  );

  const rowsRef = useRef(rows);
  const messagesRef = useRef(messages);

  useEffect(() => {
    rowsRef.current = rows;
    messagesRef.current = messages;
  }, [messages, rows]);

  useEffect(() => {
    if (partnerLeft) {
      clearDeletedRoom();
      show("info", PARTNER_LEFT_MESSAGE, () => router.back());
    }
  }, [clearDeletedRoom, partnerLeft, show]);

  const { mutate: markRead } = useMutation({
    mutationFn: (lastReadMessageId: number) =>
      api.chats.markRead(roomId, lastReadMessageId),
    onSuccess: () => {
      invalidateChatLists(queryClient);
    },
  });

  const newestMessageId = messages?.[0]?.messageId ?? 0;

  const markedMessageId = useRef(0);

  useEffect(() => {
    if (newestMessageId > markedMessageId.current) {
      markedMessageId.current = newestMessageId;
      markRead(newestMessageId);
    }
  }, [markRead, newestMessageId]);

  // 알림은 상대 메시지로만 생기므로 내가 보낼 때는 정리할 것이 없다.
  const newestPartnerMessageId = useMemo(
    () =>
      messages?.find((message) => message.senderId === partnerId)?.messageId ??
      0,
    [messages, partnerId],
  );

  useEffect(() => {
    dismissRoomNotifications(roomId).catch(() => undefined);
  }, [newestPartnerMessageId, roomId]);

  // 방에 있는 동안 상대 답장이 새로 오면 평점을 요청한다. 처음 불러온 대화는 제외.
  const seenPartnerMessageId = useRef<number | null>(null);

  useEffect(() => {
    if (!messages) {
      return;
    }

    if (
      seenPartnerMessageId.current !== null &&
      newestPartnerMessageId > seenPartnerMessageId.current
    ) {
      maybeRequestReview().catch(() => undefined);
    }

    seenPartnerMessageId.current = newestPartnerMessageId;
  }, [messages, newestPartnerMessageId]);

  const handlePressReply = useCallback((messageId: number) => {
    const index = rowsRef.current.findIndex(
      (row) => row.kind === "message" && row.message.messageId === messageId,
    );

    if (index < 0) {
      showToast("warning", REPLY_NOT_LOADED_MESSAGE);
      return;
    }

    listRef.current?.scrollToIndex({
      index,
      viewPosition: 0.5,
      animated: false,
    });
  }, []);

  const { confirmLeave } = useChatRoomActions({ show, showApiError, confirm });

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
      onPress: () => {
        if (room) {
          confirmLeave(room, () => router.back());
        }
      },
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

  const handleCopy = useCallback(async (content: string) => {
    if (!content) {
      return;
    }

    await Clipboard.setStringAsync(content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast("info", COPIED_MESSAGE);
  }, []);

  const handleSaveMedia = useCallback(
    async (url: string, kind: "photo" | "video") => {
      const video = kind === "video";

      try {
        if (await saveChatMedia(url)) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showToast("info", video ? VIDEO_SAVED_MESSAGE : PHOTO_SAVED_MESSAGE);
        } else {
          showToast("error", PHOTO_PERMISSION_MESSAGE);
        }
      } catch {
        showToast(
          "error",
          video ? VIDEO_SAVE_FAILED_MESSAGE : PHOTO_SAVE_FAILED_MESSAGE,
        );
      }
    },
    [],
  );

  // 서명 URL은 10분이면 만료되므로 재생 직전에 새로 받는다. 아직 안 보낸 건 로컬 파일이다.
  const handlePressVideo = useCallback(
    async (message: ChatMessageResponse) => {
      if (isPending(message)) {
        setPlayingUrl(message.videoUrl ?? null);
        return;
      }

      try {
        const { url } = await api.chats.videoUrl(roomId, message.messageId);
        setPlayingUrl(url);
      } catch (error) {
        if (isRoomNotFound(error)) {
          forgetRoom(queryClient, roomId);
        } else {
          showToast("error", VIDEO_URL_FAILED_MESSAGE);
        }
      }
    },
    [queryClient, roomId],
  );

  const handleOpenActions = useCallback(
    (message: ChatMessageResponse, frame: MessageFrame) => {
      if (!isPending(message)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActionTarget({
          message,
          mine: message.senderId === myMemberId,
          frame,
        });
      }
    },
    [myMemberId],
  );

  const closeActions = () => setActionTarget(null);

  const targetMessage = actionTarget?.message;
  const myReaction =
    targetMessage?.reactions.find((item) => item.memberId === myMemberId)
      ?.type ?? null;

  const selectReaction = (type: ChatReactionType) => {
    if (targetMessage) {
      closeActions();
      react({
        messageId: targetMessage.messageId,
        type: type === myReaction ? null : type,
      });
    }
  };

  const saveTargetVideo = async (message: ChatMessageResponse) => {
    try {
      const { url } = await api.chats.videoUrl(roomId, message.messageId);
      await handleSaveMedia(url, "video");
    } catch {
      showToast("error", VIDEO_SAVE_FAILED_MESSAGE);
    }
  };

  const targetImageUrl = targetMessage?.imageUrl;
  const messageActions: MessageAction[] = !targetMessage
    ? []
    : targetMessage.type === "VIDEO"
      ? [
          {
            label: "저장",
            onPress: () => {
              closeActions();
              saveTargetVideo(targetMessage);
            },
          },
        ]
      : targetImageUrl
        ? [
            {
              label: "저장",
              onPress: () => {
                closeActions();
                handleSaveMedia(targetImageUrl, "photo");
              },
            },
          ]
        : [
            {
              label: "복사",
              onPress: () => {
                closeActions();
                handleCopy(targetMessage.content ?? "");
              },
            },
          ];

  const replyNameOf = (message: ChatMessageResponse) =>
    message.replyMessage?.senderId === myMemberId
      ? "나"
      : (room?.nickname ?? "");

  const handlePressAvatar = useCallback(
    () => pushOnce(`/member/${partnerId}`),
    [partnerId],
  );

  const handleReply = useCallback((message: ChatMessageResponse) => {
    if (!isPending(message)) {
      setReplyTarget(message);
    }
  }, []);

  const handlePickPhotos = async () => {
    try {
      const assets = await pickChatMedia(MAX_PHOTOS);
      const photos = assets.filter((asset) => asset.type !== "video");
      const videos = assets.filter((asset) => asset.type === "video");
      const sendable = videos.filter((asset) => !isVideoTooLong(asset));

      // 상한에 걸리는 시도가 얼마나 되는지 봐서 멀티파트 업로드로 늘릴지 판단한다.
      videos.filter(isVideoTooLong).forEach((asset) =>
        logAppEvent(APP_EVENT.chatVideoTooLong, {
          durationSeconds: String(videoDurationSeconds(asset)),
        }),
      );

      if (sendable.length < videos.length) {
        showToast("warning", VIDEO_TOO_LONG_MESSAGE);
      }

      if (photos.length > 0) {
        sendPhotos(photos);
      }

      if (sendable.length > 0) {
        sendVideos(sendable);
      }

      if (photos.length > 0 || sendable.length > 0) {
        scrollToBottom();
      }
    } catch (error) {
      showApiError(error);
    }
  };

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const screenOptions = useMemo(
    () => ({
      title: room?.nickname ?? "",
      headerRight: () => (
        <HeaderSoloIconButton
          icon={DotsThreeIcon}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [openMenu, room?.nickname],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {room && profile && messages ? (
        <FlatList
          ref={listRef}
          data={rows}
          inverted
          renderScrollComponent={(props: ScrollViewProps) => (
            <ChatScrollView
              {...props}
              offset={keyboardOffset}
              onInsetChange={(top) => {
                insetTop.current = top;
              }}
            />
          )}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) =>
            item.kind === "day" ? (
              <ChatDay date={item.date} />
            ) : (
              <ChatMessageRow
                message={item.message}
                mine={item.message.senderId === profile.memberId}
                grouped={item.grouped}
                showTime={item.showTime}
                replyName={replyNameOf(item.message)}
                partnerId={room.memberId}
                partnerImageUrl={room.profileImageUrl ?? null}
                onPressAvatar={handlePressAvatar}
                onPressPhoto={setViewerUrl}
                onPressVideo={handlePressVideo}
                onPressReply={handlePressReply}
                onOpenActions={handleOpenActions}
                onReply={handleReply}
                myMemberId={myMemberId}
              />
            )
          }
          onScrollToIndexFailed={({ index, averageItemLength }) =>
            listRef.current?.scrollToOffset({
              offset: averageItemLength * index,
              animated: false,
            })
          }
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingVertical: space.$3.val }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <YStack items="center" py="$4">
                <Spinner size="small" />
              </YStack>
            ) : null
          }
          ListEmptyComponent={<ListEmpty>{EMPTY_MESSAGE}</ListEmpty>}
        />
      ) : (
        <ScreenState
          error={failure}
          message={ERROR_MESSAGE}
          onRetry={() => {
            refetch();
            chatMessages.refetch();
          }}
        />
      )}

      <KeyboardStickyView offset={{ opened: keyboardOffset }}>
        <ChatInputBar
          ref={inputBarRef}
          sending={sending}
          uploading={uploading}
          reply={replyTarget}
          replyName={
            replyTarget && replyTarget.senderId !== profile?.memberId
              ? (room?.nickname ?? "")
              : "나"
          }
          onSend={(content) => {
            sendText(content, replyTarget && toReply(replyTarget));
            setReplyTarget(null);
            scrollToBottom();
          }}
          onPickPhotos={handlePickPhotos}
          onCancelReply={() => setReplyTarget(null)}
        />
      </KeyboardStickyView>

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />

      <MessageActionOverlay
        target={actionTarget}
        replyName={targetMessage ? replyNameOf(targetMessage) : ""}
        myReaction={myReaction}
        actions={messageActions}
        onSelectReaction={selectReaction}
        onClose={closeActions}
      />

      {alertElement}

      <PhotoViewer
        photos={viewerUrl ? [viewerUrl] : []}
        initialIndex={0}
        open={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
      />

      <VideoPlayerModal url={playingUrl} onClose={() => setPlayingUrl(null)} />
    </SafeAreaView>
  );
}
