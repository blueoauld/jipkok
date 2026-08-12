import { useRef, useState } from "react";
import { FlatList } from "react-native";
import { YStack } from "tamagui";

import { ChatRoomRow } from "@/components/ChatRoomRow";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { ScreenState } from "@/components/ui/ScreenState";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { useChatRooms } from "@/hooks/useChatRooms";
import { usePagedList } from "@/hooks/usePagedList";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";

const ERROR_MESSAGE = "채팅방을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "채팅방이 없습니다.";
const UNREAD_EMPTY_MESSAGE = "안 읽은 채팅방이 없습니다.";

const FILTERS = ["전체", "안읽음"] as const;
type Filter = (typeof FILTERS)[number];

export default function ChatScreen() {
  const [filter, setFilter] = useState<Filter>("전체");
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const unreadOnly = filter === "안읽음";
  const { alertElement, toggleNotification, confirmLeave } =
    useChatRoomActions();
  const chatRooms = useChatRooms(unreadOnly);
  const { rooms, error } = chatRooms;
  const paged = usePagedList(chatRooms);

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={FILTERS}
          value={filter}
          onChange={(next) => {
            setFilter(next);
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />
      </YStack>

      {rooms ? (
        <FlatList
          {...paged}
          ref={listRef}
          data={rooms}
          keyExtractor={(room) => String(room.roomId)}
          renderItem={({ item }) => (
            <ChatRoomRow
              room={item}
              onToggleNotification={toggleNotification}
              onLeave={confirmLeave}
            />
          )}
          showsVerticalScrollIndicator={true}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          ListEmptyComponent={
            <YStack items="center" py="$8">
              <EmptyMessage>
                {unreadOnly ? UNREAD_EMPTY_MESSAGE : EMPTY_MESSAGE}
              </EmptyMessage>
            </YStack>
          }
        />
      ) : (
        <ScreenState
          error={error}
          message={ERROR_MESSAGE}
          onRetry={() => chatRooms.refetch()}
        />
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />

      {alertElement}
    </YStack>
  );
}
