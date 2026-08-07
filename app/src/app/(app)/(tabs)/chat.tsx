import { useRef, useState } from "react";
import { FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, getTokens, Spinner, Text, YStack } from "tamagui";

import { ChatRow } from "@/components/ChatRow";
import {
  SCROLL_EVENT_THROTTLE,
  ScrollToTopButton,
  useScrollToTopVisible,
} from "@/components/ScrollToTopButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useChatRooms } from "@/hooks/useChatRooms";
import { isApiError } from "@/lib/api";
import { tabBarOverlayHeight } from "@/lib/design";

const FILTERS = ["전체", "안읽음"] as const;
type Filter = (typeof FILTERS)[number];

const ERROR_MESSAGE = "채팅을 불러오지 못했습니다.";
const EMPTY_MESSAGE = "채팅이 없습니다.";

export default function ChatScreen() {
  const space = getTokens().space;
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("전체");
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const query = useChatRooms(filter === "안읽음");
  const { rooms, error, isFetchingNextPage, hasNextPage, fetchNextPage } =
    query;

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$2">
        <SegmentedControl
          values={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </YStack>

      {rooms ? (
        <FlatList
          ref={listRef}
          data={rooms}
          keyExtractor={(room) => String(room.roomId)}
          renderItem={({ item }) => <ChatRow room={item} />}
          showsVerticalScrollIndicator={false}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          contentContainerStyle={{
            paddingTop: space.$3.val,
            paddingBottom: space.$4.val + tabBarOverlayHeight(insets.bottom),
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
              <Text theme="gray" color="$color10" fontSize="$4">
                {EMPTY_MESSAGE}
              </Text>
            </YStack>
          }
        />
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {error ? (
            <>
              <Text color="$gray10" fontSize="$4" text="center">
                {isApiError(error) ? error.message : ERROR_MESSAGE}
              </Text>

              <Button
                size="$3"
                theme="blue"
                rounded="$7"
                onPress={() => query.refetch()}
              >
                다시 시도
              </Button>
            </>
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
