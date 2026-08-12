import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Spinner, Text, YStack } from "tamagui";

import { ChatMessageRow } from "@/components/ChatMessageRow";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ErrorState } from "@/components/ui/ErrorState";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useMyProfile } from "@/hooks/useMyProfile";
import { type ChatMessageResponse, isApiError } from "@/lib/api";
import { pushOnce } from "@/lib/router";

const ERROR_MESSAGE = "대화를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "대화 내용이 없습니다.";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const space = getTokens().space;

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessageResponse>>(null);

  const { data: profile } = useMyProfile();
  const { data: room, error: roomError, refetch } = useChatRoom(roomId);
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
          data={messages}
          inverted
          keyExtractor={(message) => String(message.messageId)}
          renderItem={({ item, index }) => (
            <ChatMessageRow
              message={item}
              older={messages[index + 1]}
              newer={messages[index - 1]}
              mine={item.senderId === profile.memberId}
              partnerId={room.memberId}
              partnerImageUrl={room.profileImageUrl ?? null}
              onPressAvatar={() => pushOnce(`/member/${room.memberId}`)}
              onPressPhoto={setViewerUrl}
            />
          )}
          showsVerticalScrollIndicator={false}
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

      <PhotoViewer
        photos={viewerUrl ? [viewerUrl] : []}
        initialIndex={0}
        open={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
      />
    </SafeAreaView>
  );
}
