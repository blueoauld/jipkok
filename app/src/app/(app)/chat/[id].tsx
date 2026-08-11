import "dayjs/locale/ko";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import {
  type ComponentProps,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FlatList } from "react-native";
import { GiftedChat, type IMessage, Message } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Spinner, YStack } from "tamagui";

import { CHAT_BUBBLE_MIN_HEIGHT, ChatBubble } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import {
  CHAT_SCROLL_TO_BOTTOM_CONTENT_STYLE,
  CHAT_SCROLL_TO_BOTTOM_STYLE,
  ChatScrollToBottom,
} from "@/components/ChatScrollToBottom";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import { UserAvatar } from "@/components/UserAvatar";
import { chatMessagesKey, useChatMessages } from "@/hooks/useChatMessages";
import { chatRoomKey, useChatRoom } from "@/hooks/useChatRoom";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import {
  api,
  type ChatMessageResponse,
  type ChatRoomResponse,
} from "@/lib/api";
import { PRESS_OPACITY } from "@/lib/design";
import { pushOnce } from "@/lib/router";
import { useThemeStore } from "@/lib/theme/store";

const AVATAR_SIZE = CHAT_BUBBLE_MIN_HEIGHT;

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
    pending: message.messageId < 0,
  };
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const space = getTokens().space;

  const queryClient = useQueryClient();
  const scheme = useThemeStore((state) => state.mode);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const { alertElement, confirm, showApiError } = useRetroAlert();

  const messagesContainerRef = useRef<FlatList<IMessage>>(null!);

  const { data: profile } = useMyProfile();
  const { data: room } = useChatRoom(roomId, true);
  const feed = useChatMessages(roomId);
  const { messages, isFetchingNextPage, hasNextPage, fetchNextPage } = feed;

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

  const giftedMessages = useMemo(
    () => (room ? (messages ?? []).map((it) => toGiftedMessage(it, room)) : []),
    [messages, room],
  );

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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {room && profile ? (
        <GiftedChat
          messages={giftedMessages}
          messagesContainerRef={
            messagesContainerRef as ComponentProps<
              typeof GiftedChat<IMessage>
            >["messagesContainerRef"]
          }
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
          scrollToBottomComponent={() => (
            <ChatScrollToBottom
              onPress={() =>
                messagesContainerRef.current?.scrollToOffset({
                  offset: 0,
                  animated: true,
                })
              }
            />
          )}
          renderMessage={(props) => (
            <Message
              {...props}
              containerStyle={{
                left: { maxWidth: "88%", marginLeft: space.$3.val },
                right: { maxWidth: "88%", marginRight: space.$3.val },
              }}
            />
          )}
          renderDay={(props) => <ChatDay {...props} />}
          renderBubble={(props) => (
            <ChatBubble {...props} onPressPhoto={setViewerUrl} />
          )}
          renderAvatar={() => (
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
          )}
          renderInputToolbar={() => null}
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
