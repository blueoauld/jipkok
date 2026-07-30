import "dayjs/locale/ko";

import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback, useState } from "react";
import { useColorScheme } from "react-native";
import { GiftedChat, type IMessage } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/ChatBubble";
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

function createInitialMessages(id: string, nickname: string): IMessage[] {
  const partner = {
    _id: id,
    name: nickname,
    avatar: `https://picsum.photos/seed/${id}-0/200/200`,
  };

  const now = Date.now();
  const minutesAgo = (minutes: number) => new Date(now - minutes * 60 * 1000);

  // TODO: 서버 연동 시 실제 대화 내역으로 교체
  // 최신 메시지가 앞에 온다.
  return [
    {
      _id: "7",
      text: "토요일 저녁은 어떠세요?",
      createdAt: minutesAgo(1),
      user: partner,
    },
    {
      _id: "6",
      text: "좋아요. 저도 이번 주말은 괜찮아요.",
      createdAt: minutesAgo(3),
      user: ME,
    },
    {
      _id: "5",
      text: "혹시 이번 주말에 시간 되시나요?",
      createdAt: minutesAgo(5),
      user: partner,
    },
    {
      _id: "4",
      text: "저도 사진 찍는 거 좋아해서 반가웠어요. 요즘은 주로 어디 다니세요?",
      createdAt: minutesAgo(5),
      user: partner,
    },
    {
      _id: "3",
      text: "프로필 보고 연락드렸어요.",
      createdAt: minutesAgo(6),
      user: partner,
    },
    {
      _id: "2",
      text: "반갑습니다.",
      createdAt: minutesAgo(6),
      user: partner,
    },
    {
      _id: "1",
      text: "안녕하세요.",
      createdAt: minutesAgo(8),
      user: ME,
    },
  ];
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
        dateFormat="M월 D일"
        dateFormatCalendar={{ sameDay: "[오늘]", lastDay: "[어제]" }}
        keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight }}
        textInputProps={{
          placeholder: "메시지 입력",
          maxLength: MESSAGE_MAX_LENGTH,
        }}
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
