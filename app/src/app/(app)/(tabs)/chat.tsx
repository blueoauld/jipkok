import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { YStack } from "tamagui";

import { ChatRoomRow } from "@/components/chat/ChatRoomRow";
import { ChatSelectionBar } from "@/components/chat/ChatSelectionBar";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { ScreenState } from "@/components/ui/ScreenState";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { useChatRooms } from "@/hooks/useChatRooms";
import { usePagedList } from "@/hooks/usePagedList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import type { ChatRoomResponse } from "@/lib/api";
import { useChatSelectionStore } from "@/lib/chat/store";
import i18n from "@/lib/i18n";
import { useLoadingOverlay } from "@/lib/overlay/store";

const FILTERS = ["ALL", "UNREAD"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_ITEMS = FILTERS.map((value) => ({
  value,
  label: i18n.t(`chat.filter.${value}`),
}));

export default function ChatScreen() {
  const { t } = useTranslation();

  const [filter, setFilter] = useState<Filter>("ALL");
  const listRef = useRef<FlatList>(null);
  const scrollTop = useScrollToTopVisible();

  const unreadOnly = filter === "UNREAD";
  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const {
    toggleNotification,
    togglePin,
    markRoomRead,
    confirmLeave,
    markRoomsRead,
    confirmLeaveRooms,
    bulkPending,
  } = useChatRoomActions({ show, showApiError, confirm });
  const chatRooms = useChatRooms(unreadOnly);
  const { rooms, error } = chatRooms;
  const tabBarOverlay = useTabBarOverlay();
  const selecting = useChatSelectionStore((state) => state.active);
  // 셀렉션 바가 흐름 안에서 그 자리를 이미 차지하므로 목록까지 비우면 두 번 센다.
  const paged = usePagedList(chatRooms, selecting ? 0 : tabBarOverlay);

  const selected = useChatSelectionStore((state) => state.selected);
  const toggleSelected = useChatSelectionStore((state) => state.toggle);
  const setRoomIds = useChatSelectionStore((state) => state.setRoomIds);
  const clearSelected = useChatSelectionStore((state) => state.clear);
  const endSelection = useChatSelectionStore((state) => state.end);

  useEffect(() => {
    setRoomIds(rooms?.map((room) => room.roomId) ?? []);
  }, [rooms, setRoomIds]);

  useEffect(() => endSelection, [endSelection]);

  useLoadingOverlay(bulkPending);

  const select = useCallback(
    (room: ChatRoomResponse) => toggleSelected(room.roomId),
    [toggleSelected],
  );

  const markSelectedRead = () => markRoomsRead([...selected], endSelection);

  const leaveSelected = () => confirmLeaveRooms([...selected], endSelection);

  return (
    <YStack flex={1}>
      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          items={FILTER_ITEMS}
          value={filter}
          onChange={(next) => {
            setFilter(next);
            clearSelected();
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />
      </YStack>

      {rooms ? (
        <FlatList
          {...paged}
          ref={listRef}
          data={rooms}
          extraData={selected}
          keyExtractor={(room) => String(room.roomId)}
          renderItem={({ item }) => (
            <ChatRoomRow
              room={item}
              selectable={selecting}
              selected={selected.has(item.roomId)}
              onSelect={select}
              onToggleNotification={toggleNotification}
              onTogglePin={togglePin}
              onMarkRead={markRoomRead}
              onLeave={confirmLeave}
            />
          )}
          showsVerticalScrollIndicator={true}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          ListEmptyComponent={
            <ListEmpty>
              {unreadOnly
                ? t("chat.list.unreadEmptyMessage")
                : t("chat.list.emptyMessage")}
            </ListEmpty>
          }
        />
      ) : (
        <ScreenState
          error={error}
          message={t("chat.list.errorMessage")}
          onRetry={() => chatRooms.refetch()}
        />
      )}

      {selecting ? (
        <ChatSelectionBar
          count={selected.size}
          pending={bulkPending}
          onMarkRead={markSelectedRead}
          onLeave={leaveSelected}
        />
      ) : (
        <ScrollToTopButton
          visible={scrollTop.visible}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
        />
      )}

      {alertElement}
    </YStack>
  );
}
