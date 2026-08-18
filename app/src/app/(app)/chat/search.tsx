import { Stack } from "expo-router";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatRoomRow } from "@/components/chat/ChatRoomRow";
import { SearchList } from "@/components/SearchList";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { useChatRoomSearch } from "@/hooks/useChatRoomSearch";
import { useRetroAlert } from "@/hooks/useRetroAlert";

const HINT_MESSAGE = "닉네임을 입력해주시길 바랍니다.";

const SCREEN_OPTIONS = { title: "채팅 검색" };

export default function ChatSearchScreen() {
  const [submitted, setSubmitted] = useState("");
  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const { toggleNotification, markRoomRead, confirmLeave } = useChatRoomActions(
    {
      show,
      showApiError,
      confirm,
    },
  );
  const search = useChatRoomSearch(submitted);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={SCREEN_OPTIONS} />

      <SearchList
        hint={HINT_MESSAGE}
        query={search}
        submitted={submitted}
        onSubmit={setSubmitted}
        items={search.rooms}
        keyExtractor={(room) => String(room.roomId)}
        renderItem={({ item }) => (
          <ChatRoomRow
            room={item}
            onToggleNotification={toggleNotification}
            onMarkRead={markRoomRead}
            onLeave={confirmLeave}
          />
        )}
      />

      {alertElement}
    </SafeAreaView>
  );
}
