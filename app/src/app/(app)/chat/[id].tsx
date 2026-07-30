import "dayjs/locale/ko";

import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback, useState } from "react";
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
import { pickSinglePhoto } from "@/hooks/usePhotos";

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

// 보내는 사람 패턴. 연속 메시지 묶음이 섞이도록 길이를 다르게 뒀다.
const IS_MINE = [true, true, false, false, false, true, false];

// 메시지 사이 간격(분). 누적되면 100개가 대략 5일치가 된다.
const GAP_MINUTES = [3, 6, 11, 27, 55, 140, 8, 320];

function createInitialMessages(id: string, nickname: string): IMessage[] {
  const partner = {
    _id: id,
    name: nickname,
    avatar: `https://picsum.photos/seed/${id}-0/200/200`,
  };

  const now = Date.now();
  let minutesBefore = 0;

  // TODO: 서버 연동 시 실제 대화 내역으로 교체
  // 최신 메시지가 앞에 온다.
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

  const handleSend = useCallback((sent: IMessage[]) => {
    // TODO: 서버로 전송 연결
    setMessages((previous) => GiftedChat.append(previous, sent));
  }, []);

  const handlePickPhoto = useCallback(async () => {
    const uri = await pickSinglePhoto();

    if (!uri) {
      return;
    }

    // TODO: 업로드 후 서버 이미지 주소로 교체
    handleSend([
      {
        _id: `${Date.now()}`,
        text: "",
        createdAt: new Date(),
        user: ME,
        image: uri,
      },
    ]);
  }, [handleSend]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: nickname }} />

      <GiftedChat
        messages={messages}
        onSend={handleSend}
        user={ME}
        locale="ko"
        colorScheme={scheme}
        isAvatarOnTop
        isDayAnimationEnabled={false}
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
        onPressActionButton={handlePickPhoto}
        onPressAvatar={() => router.push(`/member/${id}`)}
      />
    </SafeAreaView>
  );
}
