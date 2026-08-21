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
import { FlatList, RefreshControl } from "react-native";
import { XStack, YStack } from "tamagui";

import { FeedCard } from "@/components/feed/FeedCard";
import { FeedComposeDialog } from "@/components/feed/FeedComposeDialog";
import { FeedDatePicker } from "@/components/feed/FeedDatePicker";
import { FeedNotificationButton } from "@/components/feed/FeedNotificationButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { ScreenState } from "@/components/ui/ScreenState";
import { WorryCard } from "@/components/worry/WorryCard";
import { WorryCategoryFilter } from "@/components/worry/WorryCategoryChips";
import { feedPostsKey, FEEDS_KEY, useFeedPosts } from "@/hooks/useFeedPosts";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useNow } from "@/hooks/useNow";
import { usePagedList } from "@/hooks/usePagedList";
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
import { REPORTED_MESSAGE } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { mapPages } from "@/lib/paging";
import { uploadFeedPhoto } from "@/lib/photo";
import { pushOnce } from "@/lib/router";
import { showToast } from "@/lib/toast/store";

const BOARDS = ["피드", "고민"] as const;
type BoardLabel = (typeof BOARDS)[number];

const BOARD_VALUES: Record<BoardLabel, LoungeBoard> = {
  피드: "FEED",
  고민: "WORRY",
};
const BOARD_LABELS: Record<LoungeBoard, BoardLabel> = {
  FEED: "피드",
  WORRY: "고민",
};

const SORTS = ["최신", "과거"] as const;
type Sort = (typeof SORTS)[number];

const SORT_VALUES: Record<Sort, FeedSort> = { 최신: "LATEST", 과거: "OLDEST" };
const SORT_LABELS: Record<FeedSort, Sort> = { LATEST: "최신", OLDEST: "과거" };

const WORRY_SORTS = ["최신", "공감", "댓글"] as const;
type WorrySortLabel = (typeof WORRY_SORTS)[number];

const WORRY_SORT_VALUES: Record<WorrySortLabel, WorrySort> = {
  최신: "LATEST",
  공감: "POPULAR",
  댓글: "COMMENT",
};
const WORRY_SORT_LABELS: Record<WorrySort, WorrySortLabel> = {
  LATEST: "최신",
  POPULAR: "공감",
  COMMENT: "댓글",
};

const ERROR_MESSAGE = "피드를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "피드가 없습니다.";
const POSTED_MESSAGE = "피드를 올렸습니다.";
const WORRY_ERROR_MESSAGE = "고민을 불러오지 못했습니다.";
const WORRY_EMPTY_MESSAGE = "고민이 없습니다.";

const STALE_POST_CODES = new Set(["FEED_002", "FEED_003"]);

export default function FeedScreen() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [composeOpen, setComposeOpen] = useState(false);
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const [filterOpen, setFilterOpen] = useState(false);
  const [worryFilterOpen, setWorryFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const paged = usePagedList(feed);

  const worryFeed = useWorryPosts(worrySort, worryCategory);
  const {
    posts: worryPosts,
    error: worryError,
    refetch: refetchWorries,
  } = worryFeed;
  const pagedWorries = usePagedList(worryFeed);
  const [worryRefreshing, setWorryRefreshing] = useState(false);

  const refreshWorries = useCallback(async () => {
    setWorryRefreshing(true);

    try {
      await refetchWorries();
    } finally {
      setWorryRefreshing(false);
    }
  }, [refetchWorries]);

  const queryKey = feedPostsKey(date, sort);
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: FEEDS_KEY }),
    [queryClient],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await refetchFeed();
    } finally {
      setRefreshing(false);
    }
  }, [refetchFeed]);

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
    (label: BoardLabel) => {
      setBoard(BOARD_VALUES[label]);
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
      show("info", REPORTED_MESSAGE);
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
        message: "신고한 피드는 검토 후 조치됩니다.",
        confirmLabel: "신고",
        destructive: true,
        onConfirm: () => reportMutate(postId),
      }),
    [confirm, reportMutate],
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
      showToast("info", POSTED_MESSAGE);
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
                onPress={openWorrySearch}
              />
            ),
      headerRight: () => (
        <XStack>
          <HeaderIconButton
            icon={FunnelSimpleIcon}
            onPress={board === "FEED" ? openFilter : openWorryFilter}
          />
          <HeaderIconButton
            icon={NotePencilIcon}
            onPress={board === "FEED" ? openCompose : openWorryCompose}
          />
        </XStack>
      ),
    }),
    [
      board,
      openCompose,
      openFilter,
      openWorryCompose,
      openWorryFilter,
      openWorrySearch,
    ],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={BOARDS}
          value={BOARD_LABELS[board]}
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
                refreshing={worryRefreshing}
                onRefresh={refreshWorries}
              />
            }
            ListEmptyComponent={<ListEmpty>{WORRY_EMPTY_MESSAGE}</ListEmpty>}
          />
        ) : (
          <ScreenState
            error={worryError}
            message={WORRY_ERROR_MESSAGE}
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
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={<ListEmpty>{EMPTY_MESSAGE}</ListEmpty>}
        />
      ) : (
        <ScreenState
          error={error}
          message={ERROR_MESSAGE}
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
        items={SORTS.map((label) => ({
          label,
          selected: label === SORT_LABELS[sort],
          onPress: () => {
            setSort(SORT_VALUES[label]);
            scrollToTop();
          },
        }))}
      />

      <MenuSheet
        open={worryFilterOpen}
        onOpenChange={setWorryFilterOpen}
        items={WORRY_SORTS.map((label) => ({
          label,
          selected: label === WORRY_SORT_LABELS[worrySort],
          onPress: () => {
            setWorrySort(WORRY_SORT_VALUES[label]);
            scrollWorriesToTop();
          },
        }))}
      />

      {alertElement}
    </YStack>
  );
}
