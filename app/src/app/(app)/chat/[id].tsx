import "dayjs/locale/ko";

import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback, useState } from "react";
import { useColorScheme } from "react-native";
import { GiftedChat, type IMessage } from "react-native-gifted-chat";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ChatActions,
  ChatComposer,
  ChatInputToolbar,
  ChatSend,
} from "@/components/ChatInput";
import { pickSinglePhoto } from "@/hooks/usePhotos";

const ME = { _id: "me" };

const MESSAGE_MAX_LENGTH = 1000;

function createInitialMessages(id: string, nickname: string): IMessage[] {
  const partner = {
    _id: id,
    name: nickname,
    avatar: `https://picsum.photos/seed/${id}-0/200/200`,
  };

  // TODO: 서버 연동 시 실제 대화 내역으로 교체
  return [
    {
      _id: "2",
      text: "반갑습니다.",
      createdAt: new Date(),
      user: partner,
    },
    {
      _id: "1",
      text: "안녕하세요.",
      createdAt: new Date(),
      user: ME,
      sent: true,
      received: true,
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
        timeFormat="A h:mm"
        dateFormat="M월 D일"
        dateFormatCalendar={{ sameDay: "[오늘]", lastDay: "[어제]" }}
        keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight }}
        textInputProps={{
          placeholder: "메시지 입력",
          maxLength: MESSAGE_MAX_LENGTH,
        }}
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
