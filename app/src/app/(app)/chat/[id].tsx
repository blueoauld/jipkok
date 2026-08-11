import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback, useMemo } from "react";
import { GiftedChat, type IMessage } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { chatMessagesKey, useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import {
  api,
  type ChatMessageResponse,
  type ChatRoomResponse,
} from "@/lib/api";

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
  };
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const headerHeight = useHeaderHeight();

  const queryClient = useQueryClient();
  const { alertElement, showApiError } = useRetroAlert();

  const { data: profile } = useMyProfile();
  const { data: room } = useChatRoom(roomId, true);
  const { messages, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useChatMessages(roomId);

  const { mutate: sendMessage } = useMutation({
    mutationFn: (content: string) =>
      api.chats.send(roomId, { type: "TEXT", content }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: chatMessagesKey(roomId) }),
    onError: showApiError,
  });

  const giftedMessages = useMemo(
    () => (room ? (messages ?? []).map((it) => toGiftedMessage(it, room)) : []),
    [messages, room],
  );

  const onSend = useCallback(
    (sent: IMessage[]) => {
      const text = sent[0]?.text.trim();

      if (text) {
        sendMessage(text);
      }
    },
    [sendMessage],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: room?.nickname ?? "" }} />

      {room && profile ? (
        <GiftedChat
          messages={giftedMessages}
          onSend={onSend}
          user={{ _id: profile.memberId }}
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
        />
      ) : (
        <YStack flex={1} justify="center" items="center">
          <Spinner size="small" />
        </YStack>
      )}

      {alertElement}
    </SafeAreaView>
  );
}
