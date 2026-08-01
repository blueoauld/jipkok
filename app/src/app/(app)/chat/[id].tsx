import "dayjs/locale/ko";

import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { DotsThreeIcon } from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { GiftedChat, type IMessage } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { MAX_PHOTOS, pickPhotos } from "@/hooks/usePhotos";
import { pushOnce } from "@/lib/router";

const ME = { _id: "me" };

const MESSAGE_MAX_LENGTH = 1000;

const MESSAGE_COUNT = 100;

const SAMPLE_TEXTS = [
  "안녕하세요.",
  "반갑습니다.",
  "프로필 보고 연락드렸어요.",
  "오늘 하루는 어떠셨어요?",
  "저도 사진 찍는 거 좋아해서 반가웠어요. 요즘은 주로 어디 다니세요?",
  "네 맞아요.",
  "주말에는 보통 뭐 하세요?",
  "저는 집 근처 카페에서 책 읽는 걸 좋아해요.",
  "괜찮으시면 이번 주말에 커피 한잔 어떠세요?",
  "좋아요.",
  "토요일 저녁도 괜찮으세요?",
  "그럼 그때 뵈어요.",
];

const IS_MINE = [true, true, false, false, false, true, false];
const GAP_MINUTES = [3, 6, 11, 27, 55, 140, 8, 320];

function createInitialMessages(id: string, nickname: string): IMessage[] {
  const partner = { _id: id, name: nickname };

  const now = Date.now();
  let minutesBefore = 0;

  return Array.from({ length: MESSAGE_COUNT }, (_, index) => {
    const message: IMessage = {
      _id: String(MESSAGE_COUNT - index),
      text: SAMPLE_TEXTS[index % SAMPLE_TEXTS.length],
      createdAt: new Date(now - minutesBefore * 60 * 1000),
      user: IS_MINE[index % IS_MINE.length] ? ME : partner,
    };

    minutesBefore += GAP_MINUTES[index % GAP_MINUTES.length];

    return message;
  });
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nickname = `닉네임 ${id}`;

  const headerHeight = useHeaderHeight();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  const [messages, setMessages] = useState<IMessage[]>(() =>
    createInitialMessages(id, nickname),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const handleSend = useCallback((sent: IMessage[]) => {
    setMessages((previous) => GiftedChat.append(previous, sent));
  }, []);

  const handlePickPhotos = useCallback(async () => {
    const uris = (await pickPhotos(MAX_PHOTOS)).map((asset) => asset.uri);

    if (uris.length === 0) {
      return;
    }

    const now = Date.now();

    const photos: IMessage[] = uris.map((uri, index) => ({
      _id: `${now}-${index}`,
      text: "",
      createdAt: new Date(now + index),
      user: ME,
      image: uri,
    }));

    handleSend(photos.reverse());
  }, [handleSend]);

  const openMenu = useCallback(() => setMenuOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      title: nickname,
      headerRight: () => (
        <HeaderCircleIconButton
          icon={DotsThreeIcon}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [nickname, openMenu],
  );

  const menuItems: MenuSheetItem[] = [
    {
      label: "나가기",
      onPress: () => setLeaveOpen(true),
    },
    {
      label: "신고하기",
      destructive: true,
      onPress: () => setReportOpen(true),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <GiftedChat
        messages={messages}
        onSend={handleSend}
        user={ME}
        locale="ko"
        colorScheme={scheme}
        isAvatarOnTop
        isDayAnimationEnabled={false}
        isScrollToBottomEnabled
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
        renderActions={(props) => <ChatActions {...props} />}
        onPressActionButton={handlePickPhotos}
        onPressAvatar={() => pushOnce(`/member/${id}`)}
      />

      <ConfirmDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        title="채팅"
        description="신고한 채팅은 검토 후 조치됩니다."
        confirmLabel="신고"
        destructive
      />

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="채팅"
        description="나가면 주고받은 대화 내역이 모두 사라지고 목록에서도 삭제됩니다."
        confirmLabel="나가기"
        onConfirm={() => router.back()}
      />

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />
    </SafeAreaView>
  );
}
