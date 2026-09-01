import { useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, type ScrollViewProps } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getTokens, Spinner, YStack } from "tamagui";

import { ChatDay } from "@/components/chat/ChatDay";
import {
  ChatInputBar,
  type ChatInputBarHandle,
} from "@/components/chat/ChatInputBar";
import { ChatMessageRow } from "@/components/chat/ChatMessageRow";
import { ChatScrollView } from "@/components/chat/ChatScrollView";
import { MessageActionOverlay } from "@/components/chat/MessageActionOverlay";
import { VideoPlayerModal } from "@/components/chat/VideoPlayerModal";
import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { useChatMedia } from "@/hooks/useChatMedia";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { useChatRoomEffects } from "@/hooks/useChatRoomEffects";
import { forgetRoom } from "@/hooks/useChatSocket";
import { useMessageActions } from "@/hooks/useMessageActions";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useSendMessage } from "@/hooks/useSendMessage";
import type { ChatMessageResponse, ReplyMessageResponse } from "@/lib/api";
import {
  type ChatRow,
  isPending,
  isRoomNotFound,
  toChatRows,
  toReply,
} from "@/lib/chat";
import { useDeletedRoomStore } from "@/lib/chat/store";
import { pushOnce } from "@/lib/router";
import { showToast } from "@/lib/toast/store";

const HIGHLIGHT_MILLIS = 800;

export default function ChatRoomScreen() {
  const { t } = useTranslation();

  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const validRoom = Number.isInteger(roomId) && roomId > 0;
  const space = getTokens().space;

  const keyboardOffset = useSafeAreaInsets().bottom;

  const [menuOpen, setMenuOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessageResponse | null>(
    null,
  );
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  } = useChatRoom(roomId, validRoom && !partnerLeft);
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
  const media = useChatMedia({
    roomId,
    sendPhotos,
    sendVideos,
    onPicked: scrollToBottom,
    onError: showApiError,
  });
  const actions = useMessageActions(roomId, myMemberId, handleRoomError);
  const chatMessages = useChatMessages(roomId, validRoom && !partnerLeft);
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
      show("info", t("chatRoom.partnerLeft"), () => router.back());
    }
  }, [clearDeletedRoom, partnerLeft, show, t]);

  useChatRoomEffects(roomId, messages, partnerId);

  const handlePressReply = useCallback(
    (messageId: number) => {
      const index = rowsRef.current.findIndex(
        (row) => row.kind === "message" && row.message.messageId === messageId,
      );

      if (index < 0) {
        showToast("warning", t("chatRoom.replyNotLoaded"));
        return;
      }

      listRef.current?.scrollToIndex({
        index,
        viewPosition: 0.5,
        animated: false,
      });

      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current);
      }

      setHighlightedId(messageId);
      highlightTimer.current = setTimeout(
        () => setHighlightedId(null),
        HIGHLIGHT_MILLIS,
      );
    },
    [t],
  );

  useEffect(
    () => () => {
      if (highlightTimer.current) {
        clearTimeout(highlightTimer.current);
      }
    },
    [],
  );

  const { confirmLeave } = useChatRoomActions({ show, showApiError, confirm });

  const attachItems: MenuSheetItem[] = [
    { label: t("chatRoom.attachAlbum"), onPress: media.pick },
    { label: t("chatRoom.attachCamera"), onPress: media.capture },
    { label: t("chatRoom.attachVideo"), onPress: media.captureVideo },
  ];

  const menuItems: MenuSheetItem[] = [
    {
      label: t("chatRoom.profile"),
      onPress: () => {
        if (room) {
          pushOnce(`/member/${room.memberId}`);
        }
      },
    },
    {
      label: t("chatRoom.leave"),
      onPress: () => {
        if (room) {
          confirmLeave(room, () => router.back());
        }
      },
    },
    {
      label: t("action.reportSubmit"),
      destructive: true,
      onPress: () => {
        if (room) {
          pushOnce(`/report/${room.memberId}?roomId=${roomId}`);
        }
      },
    },
  ];

  const replyNameOf = (message: ChatMessageResponse) =>
    message.replyMessage?.senderId === myMemberId
      ? t("chatRoom.me")
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

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const screenOptions = useMemo(
    () => ({
      title: room?.nickname ?? "",
      headerRight: () => (
        <HeaderSoloIconButton
          icon={DotsThreeIcon}
          label={t("a11y.more")}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [openMenu, room?.nickname, t],
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
                onPressPhoto={media.openViewer}
                onPressVideo={media.playVideo}
                onPressReply={handlePressReply}
                onOpenActions={actions.open}
                onReply={handleReply}
                myMemberId={myMemberId}
                highlighted={item.message.messageId === highlightedId}
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
          ListEmptyComponent={
            <ListEmpty>{t("chatRoom.emptyMessage")}</ListEmpty>
          }
        />
      ) : (
        <ScreenState
          error={failure}
          message={t("chatRoom.errorMessage")}
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
              : t("chatRoom.me")
          }
          onSend={(content) => {
            sendText(content, replyTarget && toReply(replyTarget));
            setReplyTarget(null);
            scrollToBottom();
          }}
          onAttach={() => setAttachOpen(true)}
          onCancelReply={() => setReplyTarget(null)}
        />
      </KeyboardStickyView>

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />

      <MenuSheet
        open={attachOpen}
        onOpenChange={setAttachOpen}
        items={attachItems}
      />

      <MessageActionOverlay
        target={actions.target}
        replyName={actions.message ? replyNameOf(actions.message) : ""}
        myReaction={actions.myReaction}
        actions={actions.actions}
        onSelectReaction={actions.selectReaction}
        onClose={actions.close}
      />

      {alertElement}

      <PhotoViewer
        photos={media.viewerUrl ? [media.viewerUrl] : []}
        initialIndex={0}
        open={media.viewerUrl !== null}
        onClose={media.closeViewer}
      />

      <VideoPlayerModal url={media.playingUrl} onClose={media.closePlayer} />
    </SafeAreaView>
  );
}
