import { Stack, useLocalSearchParams } from "expo-router";
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
import { PhotoViewer } from "@/components/PhotoViewer";
import { ErrorState } from "@/components/ui/ErrorState";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useSendMessage } from "@/hooks/useSendMessage";
import { isApiError } from "@/lib/api";
import { type ChatRow, toChatRows } from "@/lib/chat";
import { pushOnce } from "@/lib/router";

const ERROR_MESSAGE = "대화를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "대화 내용이 없습니다.";


export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const space = getTokens().space;

  // 키보드가 열리면 하단 안전 영역을 덮으므로, 목록과 입력창 둘 다 그만큼 덜 올라가야 한다.
  const keyboardOffset = useSafeAreaInsets().bottom;

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatRow>>(null);

  const { alertElement, showApiError } = useRetroAlert();

  const { data: profile } = useMyProfile();
  const { data: room, error: roomError, refetch } = useChatRoom(roomId);
  const sendMessage = useSendMessage(roomId, showApiError);
  const chatMessages = useChatMessages(roomId);
  const { messages, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    chatMessages;

  const failure = roomError ?? error;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: room?.nickname ?? "" }} />

      {room && profile && messages ? (
        <FlatList
          ref={listRef}
          data={toChatRows(messages)}
          inverted
          renderScrollComponent={(props: ScrollViewProps) => (
            <ChatScrollView {...props} offset={keyboardOffset} />
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
                partnerId={room.memberId}
                partnerImageUrl={room.profileImageUrl ?? null}
                onPressAvatar={() => pushOnce(`/member/${room.memberId}`)}
                onPressPhoto={setViewerUrl}
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
          sending={sendMessage.isPending}
          onSend={sendMessage.mutate}
        />
      </KeyboardStickyView>

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
