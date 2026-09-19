import { Stack } from "expo-router";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { YStack } from "tamagui";

import { FEED_AD_ASPECT, FeedAdCard } from "@/components/ad/FeedAdCard";
import { WORRY_AD_ASPECT, WorryAdCard } from "@/components/ad/WorryAdCard";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedComposeSheet } from "@/components/feed/FeedComposeSheet";
import { FeedDatePicker } from "@/components/feed/FeedDatePicker";
import { FeedNotificationButton } from "@/components/feed/FeedNotificationButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { MenuSheet } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ScreenState } from "@/components/ui/ScreenState";
import { Tab } from "@/components/ui/Tab";
import { WorryCard } from "@/components/worry/WorryCard";
import { WorryCategoryFilter } from "@/components/worry/WorryCategoryChips";
import { useAlert } from "@/hooks/useAlert";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { useFeedPostActions } from "@/hooks/useFeedPostActions";
import { feedPostsKey, useFeedPosts } from "@/hooks/useFeedPosts";
import { useListNativeAds } from "@/hooks/useListNativeAds";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useNow } from "@/hooks/useNow";
import { usePagedList } from "@/hooks/usePagedList";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import { useWorryPosts } from "@/hooks/useWorryPosts";
import { listAdAfter } from "@/lib/ads";
import {
  type FeedPostResponse,
  type FeedSort,
  type WorryCategory,
  type WorryPostResponse,
  type WorrySort,
} from "@/lib/api";
import { fromDateParam, koreaDateParam } from "@/lib/date";
import { type LoungeBoard, useFeedFilterStore } from "@/lib/filter/store";
import i18n from "@/lib/i18n";
import { pushOnce } from "@/lib/router";

const BOARDS: LoungeBoard[] = ["FEED", "WORRY"];

const BOARD_ITEMS = BOARDS.map((value) => ({
  value,
  label: i18n.t(`lounge.board.${value}`),
}));

const SORTS: FeedSort[] = ["LATEST", "OLDEST"];

const SORT_ITEMS = SORTS.map((value) => ({
  value,
  label: i18n.t(`feed.sort.${value}`),
}));

const WORRY_SORTS: WorrySort[] = ["LATEST", "POPULAR", "COMMENT"];

const WORRY_SORT_ITEMS = WORRY_SORTS.map((value) => ({
  value,
  label: i18n.t(`feed.worrySort.${value}`),
}));

export default function FeedScreen() {
  const { t } = useTranslation();
  const { data: profile } = useMyProfile();
  const [composeOpen, setComposeOpen] = useState(false);
  const { alertElement, show, showApiError, confirm } = useAlert();

  const [filterOpen, setFilterOpen] = useState(false);
  const [worryFilterOpen, setWorryFilterOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const listRef = useRef<FlatList<FeedPostResponse>>(null);
  const worryListRef = useRef<FlatList<WorryPostResponse>>(null);
  const scrollTop = useScrollToTopVisible();
  const worryScrollTop = useScrollToTopVisible();
  const openCompose = useCallback(() => setComposeOpen(true), []);
  const openFilter = useCallback(() => setFilterOpen(true), []);
  const openWorryFilter = useCallback(() => setWorryFilterOpen(true), []);
  const openWorryCompose = useCallback(() => pushOnce("/worry/compose"), []);
  const openWorrySearch = useCallback(() => pushOnce("/worry/search"), []);
  const openWorryDetail = useCallback(
    (worryId: number) => pushOnce(`/worry/${worryId}`),
    [],
  );

  const board = useFeedFilterStore((state) => state.board);
  const setBoard = useFeedFilterStore((state) => state.setBoard);
  const sort = useFeedFilterStore((state) => state.sort);
  const setSort = useFeedFilterStore((state) => state.setSort);
  const worrySort = useFeedFilterStore((state) => state.worrySort);
  const setWorrySort = useFeedFilterStore((state) => state.setWorrySort);
  const worryCategory = useFeedFilterStore((state) => state.worryCategory);
  const setWorryCategory = useFeedFilterStore(
    (state) => state.setWorryCategory,
  );
  const storedDate = useFeedFilterStore((state) => state.date);
  const setDate = useFeedFilterStore((state) => state.setDate);
  const today = koreaDateParam(useNow());
  const date = useMemo(
    () => fromDateParam(storedDate ?? today),
    [storedDate, today],
  );
  const feed = useFeedPosts(date, sort);
  const { posts, error, refetch: refetchFeed } = feed;
  const tabBarOverlay = useTabBarOverlay();
  const paged = usePagedList(feed, tabBarOverlay, "cards");

  const worryFeed = useWorryPosts(worrySort, worryCategory);
  const {
    posts: worryPosts,
    error: worryError,
    refetch: refetchWorries,
  } = worryFeed;
  const pagedWorries = usePagedList(worryFeed, tabBarOverlay, "cards");

  const {
    ads: feedAds,
    renew: renewFeedAds,
    viewability: feedAdViewability,
  } = useListNativeAds(
    { aspectRatio: FEED_AD_ASPECT },
    board === "FEED" ? (posts?.length ?? 0) : 0,
    `${storedDate ?? today}:${sort}`,
  );
  const {
    ads: worryAds,
    renew: renewWorryAds,
    viewability: worryAdViewability,
  } = useListNativeAds(
    { aspectRatio: WORRY_AD_ASPECT },
    board === "WORRY" ? (worryPosts?.length ?? 0) : 0,
    `${worrySort}:${worryCategory}`,
  );

  const worryRefresh = usePullRefresh(
    useCallback(() => {
      renewWorryAds();

      return refetchWorries();
    }, [refetchWorries, renewWorryAds]),
  );

  const actions = useFeedPostActions({
    queryKey: feedPostsKey(date, sort),
    alert: { show, showApiError, confirm },
    onComposed: () => setComposeOpen(false),
  });

  const feedRefresh = usePullRefresh(
    useCallback(() => {
      renewFeedAds();

      return refetchFeed();
    }, [refetchFeed, renewFeedAds]),
  );

  const scrollToTop = useCallback(
    () => listRef.current?.scrollToOffset({ offset: 0, animated: false }),
    [],
  );

  const scrollWorriesToTop = useCallback(
    () => worryListRef.current?.scrollToOffset({ offset: 0, animated: false }),
    [],
  );

  // 두 보드가 목록 한 자리를 나눠 쓰므로 전환해도 스크롤이 그대로 남는다.
  const changeBoard = useCallback(
    (next: LoungeBoard) => {
      setBoard(next);
      scrollToTop();
      scrollWorriesToTop();
      scrollTop.reset();
      worryScrollTop.reset();
    },
    [scrollToTop, scrollTop, scrollWorriesToTop, setBoard, worryScrollTop],
  );

  const changeWorryCategory = useCallback(
    (category: WorryCategory | null) => {
      setWorryCategory(category);
      scrollWorriesToTop();
    },
    [scrollWorriesToTop, setWorryCategory],
  );

  const screenOptions = useMemo(
    () => ({
      title: t("tabs.lounge"),
      headerLeft:
        board === "FEED"
          ? () => <FeedNotificationButton />
          : () => (
              <HeaderIconButton
                icon={MagnifyingGlassIcon}
                label={t("a11y.search")}
                onPress={openWorrySearch}
              />
            ),
      headerRight: () => (
        <HeaderIconGroup>
          <HeaderIconButton
            icon={FunnelSimpleIcon}
            label={t("a11y.filter")}
            onPress={board === "FEED" ? openFilter : openWorryFilter}
          />
          <HeaderIconButton
            icon={NotePencilIcon}
            label={t("a11y.compose")}
            onPress={board === "FEED" ? openCompose : openWorryCompose}
          />
        </HeaderIconGroup>
      ),
    }),
    [
      board,
      openCompose,
      openFilter,
      openWorryCompose,
      openWorryFilter,
      openWorrySearch,
      t,
    ],
  );

  return (
    <YStack flex={1} bg="$greyBackground">
      <Stack.Screen options={screenOptions} />

      <Tab items={BOARD_ITEMS} value={board} onChange={changeBoard} />

      {board === "WORRY" && (
        <YStack pt="$3" pb="$3" bg="$background">
          <WorryCategoryFilter
            value={worryCategory}
            onChange={changeWorryCategory}
          />
        </YStack>
      )}

      {board === "WORRY" ? (
        worryPosts ? (
          <FlatList
            {...pagedWorries}
            {...worryAdViewability}
            ref={worryListRef}
            removeClippedSubviews
            data={worryPosts}
            keyExtractor={(worry) => String(worry.worryId)}
            renderItem={({ item, index }) => {
              const ad = listAdAfter(worryAds, index);

              return (
                <>
                  <WorryCard worry={item} onPress={openWorryDetail} />
                  {ad && <WorryAdCard ad={ad} />}
                </>
              );
            }}
            showsVerticalScrollIndicator={true}
            onScroll={worryScrollTop.onScroll}
            scrollEventThrottle={SCROLL_EVENT_THROTTLE}
            refreshControl={
              <RefreshControl
                refreshing={worryRefresh.refreshing}
                onRefresh={worryRefresh.onRefresh}
              />
            }
            ListEmptyComponent={
              <ListEmpty>{t("feed.worryEmptyMessage")}</ListEmpty>
            }
          />
        ) : (
          <ScreenState
            error={worryError}
            message={t("worry.loadFailed")}
            onRetry={refetchWorries}
          />
        )
      ) : posts ? (
        <FlatList
          {...paged}
          {...feedAdViewability}
          ref={listRef}
          removeClippedSubviews
          data={posts}
          keyExtractor={(post) => String(post.postId)}
          renderItem={({ item, index }) => {
            const ad = listAdAfter(feedAds, index);

            return (
              <>
                <FeedCard
                  post={item}
                  mine={item.memberId === profile?.memberId}
                  onPressPhoto={setViewerUrl}
                  onReport={actions.report}
                  onToggleLike={actions.toggleLike}
                />
                {ad && <FeedAdCard ad={ad} />}
              </>
            );
          }}
          showsVerticalScrollIndicator={true}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          refreshControl={
            <RefreshControl
              refreshing={feedRefresh.refreshing}
              onRefresh={feedRefresh.onRefresh}
            />
          }
          ListEmptyComponent={<ListEmpty>{t("feed.emptyMessage")}</ListEmpty>}
        />
      ) : (
        <ScreenState
          error={error}
          message={t("feed.errorMessage")}
          onRetry={refetchFeed}
        />
      )}

      <ScrollToTopButton
        visible={board === "FEED" ? scrollTop.visible : worryScrollTop.visible}
        onPress={() =>
          board === "FEED"
            ? listRef.current?.scrollToOffset({ offset: 0 })
            : worryListRef.current?.scrollToOffset({ offset: 0 })
        }
      />

      {board === "FEED" && (
        <FeedDatePicker
          date={date}
          today={today}
          onChange={(selected) => {
            setDate(selected);
            scrollToTop();
          }}
        />
      )}

      <FeedComposeSheet
        open={composeOpen}
        pending={actions.compose.isPending}
        onError={showApiError}
        onOpenChange={setComposeOpen}
        onSubmit={(photo, caption) =>
          actions.compose.mutate({ photo, caption })
        }
      />

      <PhotoViewer
        photos={viewerUrl ? [viewerUrl] : []}
        initialIndex={0}
        open={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
      />

      <MenuSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        items={SORT_ITEMS.map(({ value, label }) => ({
          label,
          selected: value === sort,
          onPress: () => {
            setSort(value);
            scrollToTop();
          },
        }))}
      />

      <MenuSheet
        open={worryFilterOpen}
        onOpenChange={setWorryFilterOpen}
        items={WORRY_SORT_ITEMS.map(({ value, label }) => ({
          label,
          selected: value === worrySort,
          onPress: () => {
            setWorrySort(value);
            scrollWorriesToTop();
          },
        }))}
      />

      {alertElement}
    </YStack>
  );
}
