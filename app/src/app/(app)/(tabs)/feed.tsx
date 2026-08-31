import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import type { ImagePickerAsset } from "expo-image-picker";
import { Tabs } from "expo-router";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl } from "react-native";
import { YStack } from "tamagui";

import { FeedCard } from "@/components/feed/FeedCard";
import { FeedComposeDialog } from "@/components/feed/FeedComposeDialog";
import { FeedDatePicker } from "@/components/feed/FeedDatePicker";
import { FeedNotificationButton } from "@/components/feed/FeedNotificationButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { MenuSheet } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { ScreenState } from "@/components/ui/ScreenState";
import { WorryCard } from "@/components/worry/WorryCard";
import { WorryCategoryFilter } from "@/components/worry/WorryCategoryChips";
import { useTabBarOverlay } from "@/hooks/useBottomBar";
import { feedPostsKey, FEEDS_KEY, useFeedPosts } from "@/hooks/useFeedPosts";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useNow } from "@/hooks/useNow";
import { usePagedList } from "@/hooks/usePagedList";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import { useWorryPosts } from "@/hooks/useWorryPosts";
import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import {
  api,
  type FeedPostPage,
  type FeedPostResponse,
  type FeedSort,
  isApiError,
  type WorryCategory,
  type WorryPostResponse,
  type WorrySort,
} from "@/lib/api";
import { fromDateParam, toDateParam } from "@/lib/date";
import { type LoungeBoard, useFeedFilterStore } from "@/lib/filter/store";
import i18n from "@/lib/i18n";
import { reportedMessage } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { mapPages } from "@/lib/paging";
import { uploadFeedPhoto } from "@/lib/photo";
import { pushOnce } from "@/lib/router";
import { showToast } from "@/lib/toast/store";

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

const STALE_POST_CODES = new Set(["FEED_002", "FEED_003"]);

export default function FeedScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [composeOpen, setComposeOpen] = useState(false);
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

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
  const today = toDateParam(new Date(useNow()));
  const date = useMemo(
    () => fromDateParam(storedDate ?? today),
    [storedDate, today],
  );
  const feed = useFeedPosts(date, sort);
  const { posts, error, refetch: refetchFeed } = feed;
  const tabBarOverlay = useTabBarOverlay();
  const paged = usePagedList(feed, tabBarOverlay);

  const worryFeed = useWorryPosts(worrySort, worryCategory);
  const {
    posts: worryPosts,
    error: worryError,
    refetch: refetchWorries,
  } = worryFeed;
  const pagedWorries = usePagedList(worryFeed, tabBarOverlay);

  const worryRefresh = usePullRefresh(refetchWorries);

  const queryKey = feedPostsKey(date, sort);
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: FEEDS_KEY }),
    [queryClient],
  );

  const feedRefresh = usePullRefresh(refetchFeed);

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

  // 지워졌거나 이미 신고한 글이면 화면의 글이 낡은 것이므로 목록을 다시 받는다.
  const handlePostError = useCallback(
    (mutationError: unknown) => {
      if (
        isApiError(mutationError) &&
        STALE_POST_CODES.has(mutationError.code)
      ) {
        invalidate();
      }

      showApiError(mutationError);
    },
    [invalidate, showApiError],
  );

  const toggleLike = useMutation({
    mutationFn: (post: FeedPostResponse) =>
      post.likedByMe
        ? api.feeds.cancelLike(post.postId)
        : api.feeds.like(post.postId),
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<FeedPostPage>>(queryKey);

      queryClient.setQueryData<InfiniteData<FeedPostPage>>(
        queryKey,
        (current) =>
          mapPages(current, (items) =>
            items.map((item) =>
              item.postId === post.postId
                ? { ...item, likedByMe: !item.likedByMe }
                : item,
            ),
          ),
      );

      return { previous };
    },
    onError: (mutationError, _post, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      handlePostError(mutationError);
    },
  });

  const report = useMutation({
    mutationFn: api.feeds.report,
    onSuccess: async () => {
      await invalidate();
      show("info", reportedMessage());
    },
    onError: handlePostError,
  });

  const { mutate: toggleLikeMutate } = toggleLike;
  const { mutate: reportMutate } = report;

  const handleToggleLike = useCallback(
    (post: FeedPostResponse) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleLikeMutate(post);
    },
    [toggleLikeMutate],
  );

  const handleReport = useCallback(
    (postId: number) =>
      confirm({
        message: t("feed.reportConfirm"),
        confirmLabel: t("action.report"),
        destructive: true,
        onConfirm: () => reportMutate(postId),
      }),
    [confirm, reportMutate, t],
  );

  const compose = useMutation({
    mutationFn: async ({
      photo,
      caption,
    }: {
      photo: ImagePickerAsset;
      caption: string;
    }) => {
      const objectKey = await uploadFeedPhoto(photo);

      await api.feeds.create({ objectKey, caption: caption || null });
    },
    onSuccess: async () => {
      logAppEvent(APP_EVENT.feedPostCreated);
      setComposeOpen(false);
      await invalidate();
      showToast("info", t("feed.posted"));
    },
    onError: showApiError,
  });

  useLoadingOverlay(report.isPending);

  const screenOptions = useMemo(
    () => ({
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
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          items={BOARD_ITEMS}
          value={board}
          onChange={changeBoard}
        />
      </YStack>

      {board === "WORRY" && (
        <YStack pb="$3">
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
            ref={worryListRef}
            data={worryPosts}
            keyExtractor={(worry) => String(worry.worryId)}
            renderItem={({ item }) => (
              <WorryCard worry={item} onPress={openWorryDetail} />
            )}
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
          ref={listRef}
          data={posts}
          keyExtractor={(post) => String(post.postId)}
          renderItem={({ item }) => (
            <FeedCard
              post={item}
              mine={item.memberId === profile?.memberId}
              onPressPhoto={setViewerUrl}
              onReport={handleReport}
              onToggleLike={handleToggleLike}
            />
          )}
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
          onChange={(selected) => {
            setDate(selected);
            scrollToTop();
          }}
        />
      )}

      <FeedComposeDialog
        open={composeOpen}
        pending={compose.isPending}
        onError={showApiError}
        onOpenChange={setComposeOpen}
        onSubmit={(photo, caption) => compose.mutate({ photo, caption })}
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
