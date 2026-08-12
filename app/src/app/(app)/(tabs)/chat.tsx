import { useRef, useState } from "react";
import { FlatList } from "react-native";
import { getTokens, Spinner, Text, YStack } from "tamagui";

import { ChatRoomRow } from "@/components/ChatRoomRow";
import {
  SCROLL_EVENT_THROTTLE,
  ScrollToTopButton,
  useScrollToTopVisible,
} from "@/components/ScrollToTopButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { useChatRooms } from "@/hooks/useChatRooms";
import { isApiError } from "@/lib/api";

const ERROR_MESSAGE = "채팅방을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "채팅방이 없습니다.";
const UNREAD_EMPTY_MESSAGE = "안 읽은 채팅방이 없습니다.";

const FILTERS = ["전체", "안읽음"] as const;
type Filter = (typeof FILTERS)[number];

export default function ChatScreen() {
  const space = getTokens().space;
  const [filter, setFilter] = useState<Filter>("전체");
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const unreadOnly = filter === "안읽음";
  const { alertElement, toggleNotification, confirmLeave } =
    useChatRoomActions();
  const chatRooms = useChatRooms(unreadOnly);
  const { rooms, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    chatRooms;

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
          contentContainerStyle={{
            paddingTop: space.$2.val,
            paddingBottom: space.$4.val,
            paddingHorizontal: space.$4.val,
            gap: space.$4.val,
          }}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <YStack items="center" py="$4">
                <Spinner size="small" />
              </YStack>
            ) : null
          }
          ListEmptyComponent={
            <YStack items="center" py="$8">
              <Text fontSize="$4">
                {unreadOnly ? UNREAD_EMPTY_MESSAGE : EMPTY_MESSAGE}
              </Text>
            </YStack>
          }
        />
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {error ? (
            <ErrorState
              message={isApiError(error) ? error.message : ERROR_MESSAGE}
              onRetry={() => chatRooms.refetch()}
            />
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />

      {alertElement}
    </YStack>
  );
}
