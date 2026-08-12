import { useRef } from "react";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTokens, Spinner, Text, YStack } from "tamagui";

import { ChatRoomRow } from "@/components/ChatRoomRow";
import {
  SCROLL_EVENT_THROTTLE,
  ScrollToTopButton,
  useScrollToTopVisible,
} from "@/components/ScrollToTopButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useChatRooms } from "@/hooks/useChatRooms";
import { isApiError } from "@/lib/api";
import { tabBarOverlayHeight } from "@/lib/design";

const ERROR_MESSAGE = "채팅방을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "채팅방이 없습니다.";

export default function ChatScreen() {
  const space = getTokens().space;
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const chatRooms = useChatRooms();
  const { rooms, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    chatRooms;

  return (
    <YStack flex={1}>
      {rooms ? (
        <FlatList
          ref={listRef}
          data={rooms}
          keyExtractor={(room) => String(room.roomId)}
          renderItem={({ item }) => <ChatRoomRow room={item} />}
          showsVerticalScrollIndicator={false}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          contentContainerStyle={{
            paddingTop: space.$4.val,
            paddingBottom: space.$3.val + tabBarOverlayHeight(insets.bottom),
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
              <Text fontSize="$4">{EMPTY_MESSAGE}</Text>
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
    </YStack>
  );
}
