import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatRoomRow } from "@/components/chat/ChatRoomRow";
import { SearchList } from "@/components/SearchList";
import { useAlert } from "@/hooks/useAlert";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { useChatRoomSearch } from "@/hooks/useChatRoomSearch";

export default function ChatSearchScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(() => ({ title: t("chat.search.title") }), [t]);

  const [submitted, setSubmitted] = useState("");
  const { alertElement, show, showApiError, confirm } = useAlert();
  const { toggleNotification, togglePin, markRoomRead, confirmLeave } =
    useChatRoomActions({
      show,
      showApiError,
      confirm,
    });
  const search = useChatRoomSearch(submitted);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <SearchList
        hint={t("chat.search.hint")}
        query={search}
        submitted={submitted}
        onSubmit={setSubmitted}
        items={search.rooms}
        keyExtractor={(room) => String(room.roomId)}
        renderItem={({ item }) => (
          <ChatRoomRow
            room={item}
            onToggleNotification={toggleNotification}
            onTogglePin={togglePin}
            onMarkRead={markRoomRead}
            onLeave={confirmLeave}
          />
        )}
      />

      {alertElement}
    </SafeAreaView>
  );
}
