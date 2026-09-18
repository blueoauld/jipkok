import { useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, type ScrollViewProps, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ChatDay } from "@/components/chat/ChatDay";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import {
  ChatMessageRow,
  MESSAGE_GAP_BOTTOM,
} from "@/components/chat/ChatMessageRow";
import { ChatSafetyNotice } from "@/components/chat/ChatSafetyNotice";
import { ChatScrollView } from "@/components/chat/ChatScrollView";
import { MessageActionOverlay } from "@/components/chat/MessageActionOverlay";
import { VideoPlayerModal } from "@/components/chat/VideoPlayerModal";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { useAlert } from "@/hooks/useAlert";
import { useExtraBottomSpacing } from "@/hooks/useBottomBar";
import { useChatMedia } from "@/hooks/useChatMedia";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useChatRoomEffects } from "@/hooks/useChatRoomEffects";
import { useChatRoomMenus } from "@/hooks/useChatRoomMenus";
import { forgetRoom } from "@/hooks/useChatSocket";
import { useMessageActions } from "@/hooks/useMessageActions";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useSendMessage } from "@/hooks/useSendMessage";
import type { ChatMessageResponse } from "@/lib/api";
import { isPending, isRoomNotFound, toReply } from "@/lib/chat";
import { type ChatRow, toChatRows } from "@/lib/chat/rows";
import { useDeletedRoomStore } from "@/lib/chat/store";
import { INPUT_BAR_PADDING_Y, SCREEN_PADDING } from "@/lib/design";
import { pushOnce } from "@/lib/router";
import { showToast } from "@/lib/toast/store";

const HIGHLIGHT_MILLIS = 800;

// 끝 말풍선의 아래 여백과 합쳐 입력줄 위가 화면 좌우 여백과 같게 한다.
const LIST_PADDING_Y = SCREEN_PADDING - MESSAGE_GAP_BOTTOM;

export default function ChatRoomScreen() {
  const { t } = useTranslation();

  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const validRoom = Number.isInteger(roomId) && roomId > 0;

  const keyboardOffset = useSafeAreaInsets().bottom;
  const extraBottom = useExtraBottomSpacing(INPUT_BAR_PADDING_Y);

  const [menuOpen, setMenuOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessageResponse | null>(
    null,
  );
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState(0);
  const [contentTop, setContentTop] = useState(0);
  const contentRef = useRef<View>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<ChatRow>>(null);

  const insetTop = useRef(0);

  const scrollToBottom = () =>
    listRef.current?.scrollToOffset({
      offset: -insetTop.current,
      animated: false,
    });

  const queryClient = useQueryClient();
  const { alertElement, confirm, show, showApiError } = useAlert();

  const deletedRoomId = useDeletedRoomStore((state) => state.roomId);
  const partnerLeft = deletedRoomId === roomId;
  const roomAlive = validRoom && !partnerLeft;

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
  } = useChatRoom(roomId, roomAlive);
  const { sendText, sendPhotos, sendVideos, uploading } = useSendMessage(
    roomId,
    myMemberId,
    handleRoomError,
  );
  const media = useChatMedia({
    roomId,
    sendPhotos,
    sendVideos,
    onPicked: scrollToBottom,
    onError: showApiError,
  });
  const handleReply = useCallback((message: ChatMessageResponse) => {
    if (!isPending(message)) {
      setReplyTarget(message);
    }
  }, []);

  const actions = useMessageActions(
    roomId,
    myMemberId,
    handleRoomError,
    handleReply,
  );
  const chatMessages = useChatMessages(roomId, roomAlive);
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

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // 뷰어는 방의 사진을 시간순으로 넘겨 본다. 목록은 최신순이라 뒤집는다.
  const photos = useMemo(
    () =>
      (messages ?? [])
        .flatMap((message) =>
          message.type === "PHOTO" && message.imageUrl != null
            ? [{ id: message.messageId, url: message.imageUrl }]
            : [],
        )
        .reverse(),
    [messages],
  );
  const photoUrls = useMemo(() => photos.map((photo) => photo.url), [photos]);
  // URL은 목록을 다시 받을 때마다 새로 서명되므로 자리를 잡는 데 쓸 수 없다.
  const viewerIndex =
    media.viewerMessageId === null
      ? -1
      : photos.findIndex((photo) => photo.id === media.viewerMessageId);

  useEffect(() => {
    if (partnerLeft) {
      show("info", t("chatRoom.partnerLeft"), () => router.back());
    }
  }, [partnerLeft, show, t]);

  // 알림과 함께 지우면 partnerLeft가 풀려 방 쿼리가 다시 켜지고, 404가 플래그를 또
  // 세워 알림까지 되풀이된다. 화면을 떠날 때 지워야 다음 입장이 막히지 않는다.
  useEffect(
    () => () => {
      const store = useDeletedRoomStore.getState();

      if (store.roomId === roomId) {
        store.clear();
      }
    },
    [roomId],
  );

  useChatRoomEffects(roomId, messages, partnerId);

  const handlePressQuote = useCallback(
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

  const { attachItems, menuItems } = useChatRoomMenus({
    room,
    roomId,
    attach: {
      album: media.pick,
      camera: media.capture,
      video: media.captureVideo,
    },
    alert: { show, showApiError, confirm },
  });

  const nameOf = (senderId?: number) =>
    senderId === myMemberId ? t("chatRoom.me") : (room?.nickname ?? "");

  const replyNameOf = (message: ChatMessageResponse) =>
    nameOf(message.replyMessage?.senderId);

  const handlePressAvatar = useCallback(
    () => pushOnce(`/member/${partnerId}`),
    [partnerId],
  );

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const screenOptions = useMemo(
    () => ({
      title: room?.nickname ?? "",
      headerRight: () => (
        <HeaderIconButton
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
    <SafeAreaView
      ref={contentRef}
      style={{ flex: 1 }}
      edges={["bottom"]}
      // 헤더가 투명하지 않으므로 화면의 시작이 곧 헤더 아래다. 메뉴 오버레이가 그 위로 안 올라가게 알려준다.
      onLayout={() =>
        contentRef.current?.measureInWindow((_x, y) => setContentTop(y))
      }
    >
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
                mine={item.message.senderId === myMemberId}
                grouped={item.grouped}
                showTime={item.showTime}
                replyName={replyNameOf(item.message)}
                partnerId={room.memberId}
                partnerName={room.nickname}
                partnerImageUrl={room.profileImageUrl ?? null}
                onPressAvatar={handlePressAvatar}
                onPressPhoto={media.openViewer}
                onPressVideo={media.playVideo}
                onPressQuote={handlePressQuote}
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
          contentContainerStyle={{ paddingVertical: LIST_PADDING_Y }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          // 뒤집힌 목록이라 꼬리가 화면 맨 위, 곧 대화가 시작되는 자리다.
          ListFooterComponent={
            isFetchingNextPage ? (
              <YStack items="center" py="$4">
                <Spinner size="small" color="$grey500" />
              </YStack>
            ) : hasNextPage ? null : (
              <ChatSafetyNotice />
            )
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

      <KeyboardStickyView offset={{ opened: keyboardOffset + extraBottom }}>
        <YStack
          pb={extraBottom}
          onLayout={(event) =>
            setInputBarHeight(event.nativeEvent.layout.height)
          }
        >
          <ChatInputBar
            roomId={roomId}
            uploading={uploading}
            reply={replyTarget}
            replyName={nameOf(replyTarget?.senderId)}
            onSend={(content) => {
              sendText(content, replyTarget && toReply(replyTarget));
              setReplyTarget(null);
              scrollToBottom();
            }}
            onAttach={() => setAttachOpen(true)}
            onCancelReply={() => setReplyTarget(null)}
          />
        </YStack>
      </KeyboardStickyView>

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />

      <MenuSheet
        open={attachOpen}
        onOpenChange={setAttachOpen}
        items={attachItems}
      />

      <MessageActionOverlay
        target={actions.target}
        contentTop={contentTop}
        reservedBottom={inputBarHeight}
        myReaction={actions.myReaction}
        actions={actions.actions}
        onSelectReaction={actions.selectReaction}
        onClose={actions.close}
      />

      {alertElement}

      <PhotoViewer
        photos={photoUrls}
        initialIndex={Math.max(0, viewerIndex)}
        open={viewerIndex >= 0}
        onClose={media.closeViewer}
      />

      <VideoPlayerModal url={media.playingUrl} onClose={media.closePlayer} />
    </SafeAreaView>
  );
}
