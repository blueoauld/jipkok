import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useMemo, useState } from "react";
import { GiftedChat, type IMessage, Message } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ChatBubble, displayMinute } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import {
  ChatActions,
  ChatComposer,
  ChatInputToolbar,
  ChatSend,
} from "@/components/ChatInput";
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
import {
  api,
  type ChatMessageResponse,
  type ChatRoomResponse,
} from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";
import { uploadChatPhoto } from "@/lib/photo";
import { pushOnce } from "@/lib/router";

const AVATAR_SIZE = 36;
const MINUTE_GROUP_GAP = 10;

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
  };
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const headerHeight = useHeaderHeight();

  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const { alertElement, confirm, showApiError } = useRetroAlert();

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
          isAvatarOnTop
          isAvatarVisibleForEveryMessage
          isDayAnimationEnabled={false}
          renderDay={(props) => <ChatDay {...props} />}
          renderMessage={(props) => {
            const { currentMessage, previousMessage } = props;
            const newMinuteSameUser =
              !!previousMessage?.createdAt &&
              previousMessage.user._id === currentMessage.user._id &&
              displayMinute(previousMessage.createdAt) !==
                displayMinute(currentMessage.createdAt);
            const marginTop = newMinuteSameUser ? MINUTE_GROUP_GAP : 0;

            return (
              <Message
                {...props}
                containerStyle={{
                  left: { marginTop },
                  right: { marginTop },
                }}
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
