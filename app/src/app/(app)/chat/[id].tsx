import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useRef, useState } from "react";
import { FlatList, type ScrollViewProps } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getTokens, Spinner, Text, YStack } from "tamagui";

import { ChatDay } from "@/components/ChatDay";
import { ChatInputBar } from "@/components/ChatInputBar";
import { ChatMessageRow } from "@/components/ChatMessageRow";
import { ChatScrollView } from "@/components/ChatScrollView";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ErrorState } from "@/components/ui/ErrorState";
import { chatMessagesKey, useChatMessages } from "@/hooks/useChatMessages";
import { chatRoomKey, useChatRoom } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useMyProfile } from "@/hooks/useMyProfile";
import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useSendMessage } from "@/hooks/useSendMessage";
import { api, type ChatMessageResponse, isApiError } from "@/lib/api";
import { type ChatRow, toChatRows } from "@/lib/chat";
import { pushOnce } from "@/lib/router";

const ERROR_MESSAGE = "대화를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "대화 내용이 없습니다.";

const LEAVE_DESCRIPTION =
  "나가면 주고받은 대화 내역이 서로에게서 모두 사라집니다.";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const space = getTokens().space;

  // 키보드가 열리면 하단 안전 영역을 덮으므로, 목록과 입력창 둘 다 그만큼 덜 올라가야 한다.
  const keyboardOffset = useSafeAreaInsets().bottom;

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessageResponse | null>(
    null,
  );
  const listRef = useRef<FlatList<ChatRow>>(null);

  // 키보드가 열리면 뒤집힌 리스트 위쪽에 인셋이 붙어 오프셋 0이 끝이 아니게 된다.
  const insetTop = useRef(0);

  const scrollToBottom = () =>
    listRef.current?.scrollToOffset({
      offset: -insetTop.current,
      animated: false,
    });

  const queryClient = useQueryClient();
  const { alertElement, confirm, showApiError } = useRetroAlert();

  const { data: profile } = useMyProfile();
  const { data: room, error: roomError, refetch } = useChatRoom(roomId);
  const { sendText, sendPhotos, sending, uploading } = useSendMessage(
    roomId,
    showApiError,
  );
  const chatMessages = useChatMessages(roomId);
  const { messages, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    chatMessages;

  const failure = roomError ?? error;

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

  const handlePickPhotos = async () => {
    const assets = await pickPhotos(MAX_PHOTOS);

    if (assets.length > 0) {
      sendPhotos(assets);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: room?.nickname ?? "",
          headerRight: () => (
            <HeaderCircleIconButton
              icon={DotsThreeIcon}
              weight="bold"
              onPress={() => setMenuOpen(true)}
            />
          ),
        }}
      />

      {room && profile && messages ? (
        <FlatList
          ref={listRef}
          data={toChatRows(messages)}
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
                replyName={
                  item.message.replyMessage?.senderId === profile.memberId
                    ? "나"
                    : room.nickname
                }
                partnerId={room.memberId}
                partnerImageUrl={room.profileImageUrl ?? null}
                onPressAvatar={() => pushOnce(`/member/${room.memberId}`)}
                onPressPhoto={setViewerUrl}
                onReply={setReplyTarget}
              />
            )
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
            <YStack items="center" py="$8">
              <Text fontSize="$4">{EMPTY_MESSAGE}</Text>
            </YStack>
          }
        />
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {failure ? (
            <ErrorState
              message={isApiError(failure) ? failure.message : ERROR_MESSAGE}
              onRetry={() => {
                refetch();
                chatMessages.refetch();
              }}
            />
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

      <KeyboardStickyView offset={{ opened: keyboardOffset }}>
        <ChatInputBar
          sending={sending}
          uploading={uploading}
          reply={replyTarget}
          replyName={
            replyTarget && replyTarget.senderId !== profile?.memberId
              ? (room?.nickname ?? "")
              : "나"
          }
          onSend={(content) => {
            sendText(content, replyTarget?.messageId ?? null);
            setReplyTarget(null);
            scrollToBottom();
          }}
          onPickPhotos={handlePickPhotos}
          onCancelReply={() => setReplyTarget(null)}
        />
      </KeyboardStickyView>

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />

      {alertElement}

      <PhotoViewer
        photos={viewerUrl ? [viewerUrl] : []}
        initialIndex={0}
        open={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
      />
    </SafeAreaView>
  );
}
