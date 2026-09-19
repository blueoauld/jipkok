import { Stack } from "expo-router";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { YStack } from "tamagui";

import { RowListAdCard } from "@/components/ad/RowListAdCard";
import { ChatRoomRow } from "@/components/chat/ChatRoomRow";
import { ChatSelectionBar } from "@/components/chat/ChatSelectionBar";
import {
  ChatHeaderRight,
  SelectAllButton,
  SelectionCancelButton,
} from "@/components/chat/ChatTabHeader";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ListRowTopSpacer } from "@/components/ui/ListRow";
import { ScreenState } from "@/components/ui/ScreenState";
import { Tab } from "@/components/ui/Tab";
import { useAlert } from "@/hooks/useAlert";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useChatRoomActions } from "@/hooks/useChatRoomActions";
import { useChatRooms } from "@/hooks/useChatRooms";
import { usePagedList } from "@/hooks/usePagedList";
import { useScreenNativeAd } from "@/hooks/useScreenNativeAd";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import { CHAT_NATIVE_AD_UNIT_ID } from "@/lib/ads";
import type { ChatRoomResponse } from "@/lib/api";
import { useChatSelectionStore } from "@/lib/chat/store";
import { BOTTOM_CTA_FADE_HEIGHT, LIST_ROW_EVEN_PADDING_Y } from "@/lib/design";
import i18n from "@/lib/i18n";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { pushOnce } from "@/lib/router";

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
  const { alertElement, show, showApiError, confirm } = useAlert();
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
  const ad = useScreenNativeAd(
    CHAT_NATIVE_AD_UNIT_ID,
    (rooms?.length ?? 0) > 0,
  );
  const tabBarOverlay = useTabBarOverlay();
  const selecting = useChatSelectionStore((state) => state.active);
  // 고르는 중에는 탭 바를 숨기고 셀렉션 바가 흐름 안에서 바닥을 차지하므로, 바 위로 겹치는 흐림 띠만큼만 비운다.
  const paged = usePagedList(
    chatRooms,
    selecting ? BOTTOM_CTA_FADE_HEIGHT : tabBarOverlay,
    "rows",
  );

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

  const screenOptions = useMemo(
    () => ({
      title: selecting
        ? t("tabs.selectedCount", { count: selected.size })
        : t("tabs.chat"),
      headerLeft: selecting
        ? () => <SelectionCancelButton />
        : () => (
            <HeaderIconButton
              icon={MagnifyingGlassIcon}
              label={t("a11y.search")}
              onPress={() => pushOnce("/chat/search")}
            />
          ),
      headerRight: selecting
        ? () => <SelectAllButton />
        : () => <ChatHeaderRight />,
    }),
    [selected.size, selecting, t],
  );

  const markSelectedRead = () => markRoomsRead([...selected], endSelection);

  const leaveSelected = () => confirmLeaveRooms([...selected], endSelection);

  return (
    <YStack flex={1}>
      <Stack.Screen options={screenOptions} />

      <Tab
        items={FILTER_ITEMS}
        value={filter}
        onChange={(next) => {
          setFilter(next);
          clearSelected();
          listRef.current?.scrollToOffset({ offset: 0, animated: false });
          scrollTop.reset();
        }}
      />

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
          ListHeaderComponent={
            ad && !selecting ? (
              <RowListAdCard ad={ad} atTop />
            ) : (
              <ListRowTopSpacer verticalPadding={LIST_ROW_EVEN_PADDING_Y} />
            )
          }
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
