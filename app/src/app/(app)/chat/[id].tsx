import "dayjs/locale/ko";

import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { DotsThreeIcon } from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { GiftedChat, type IMessage } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, YStack } from "tamagui";

import { ChatBubble } from "@/components/ChatBubble";
import { ChatDay } from "@/components/ChatDay";
import {
  ChatActions,
  ChatComposer,
  ChatInputToolbar,
  ChatSend,
} from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import {
  CHAT_SCROLL_TO_BOTTOM_CONTENT_STYLE,
  CHAT_SCROLL_TO_BOTTOM_STYLE,
  ChatScrollToBottom,
} from "@/components/ChatScrollToBottom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useMyProfile } from "@/hooks/useMyProfile";
import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { useSendMessage } from "@/hooks/useSendMessage";
import type { ChatMessageResponse, ChatRoomResponse } from "@/lib/api";
import { pushOnce } from "@/lib/router";

const MESSAGE_MAX_LENGTH = 1000;

const LOAD_EARLIER_LABEL = "이전 메시지 보기";

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
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data: profile } = useMyProfile();
  const { data: room } = useChatRoom(roomId);
  const feed = useChatMessages(roomId);
  const { sendText, sendPhotos, uploading } = useSendMessage(roomId);
  const { messages, isFetchingNextPage, hasNextPage, fetchNextPage } = feed;

  const giftedMessages = useMemo(
    () => (room ? (messages ?? []).map((it) => toGiftedMessage(it, room)) : []),
    [messages, room],
  );

  const handleSend = useCallback(
    (sent: IMessage[]) => {
      const text = sent[0]?.text.trim();

      if (text) {
        sendText(text);
      }
    },
    [sendText],
  );

  const handlePickPhotos = useCallback(async () => {
    const assets = await pickPhotos(MAX_PHOTOS);

    if (assets.length > 0) {
      sendPhotos(assets);
    }
  }, [sendPhotos]);

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
      label: "나가기",
      onPress: () => setLeaveOpen(true),
    },
    {
      label: "신고하기",
      destructive: true,
      onPress: () => {
        if (room) {
          pushOnce(`/report/${room.memberId}`);
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
          onSend={handleSend}
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
            label: LOAD_EARLIER_LABEL,
          }}
          scrollToBottomStyle={CHAT_SCROLL_TO_BOTTOM_STYLE}
          scrollToBottomContentStyle={CHAT_SCROLL_TO_BOTTOM_CONTENT_STYLE}
          scrollToBottomComponent={() => <ChatScrollToBottom />}
          keyboardAvoidingViewProps={{
            behavior: "padding",
            keyboardVerticalOffset: headerHeight,
          }}
          textInputProps={{
            placeholder: "메시지 입력",
            maxLength: MESSAGE_MAX_LENGTH,
          }}
          renderDay={(props) => <ChatDay {...props} />}
          renderMessage={(props) => <ChatMessage {...props} />}
          renderBubble={(props) => <ChatBubble {...props} />}
          renderInputToolbar={(props) => <ChatInputToolbar {...props} />}
          renderComposer={(props) => <ChatComposer {...props} />}
          renderSend={(props) => <ChatSend {...props} />}
          renderActions={(props) => (
            <ChatActions {...props} uploading={uploading} />
          )}
          onPressActionButton={handlePickPhotos}
          onPressAvatar={() => pushOnce(`/member/${room.memberId}`)}
        />
      ) : (
        <YStack flex={1} justify="center" items="center">
          <Spinner size="small" />
        </YStack>
      )}

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="채팅"
        description={LEAVE_DESCRIPTION}
        confirmLabel="나가기"
        onConfirm={() => router.back()}
      />

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />
    </SafeAreaView>
  );
}
