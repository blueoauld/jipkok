import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import type { ImagePickerAsset } from "expo-image-picker";
import { Tabs } from "expo-router";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
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
import { feedPostsKey, FEEDS_KEY, useFeedPosts } from "@/hooks/useFeedPosts";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useNow } from "@/hooks/useNow";
import { usePagedList } from "@/hooks/usePagedList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import {
  api,
  type FeedPostPage,
  type FeedPostResponse,
  type FeedSort,
  isApiError,
} from "@/lib/api";
import { fromDateParam, toDateParam } from "@/lib/date";
import { useFeedFilterStore } from "@/lib/filter/store";
import { REPORTED_MESSAGE } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { mapPages } from "@/lib/paging";
import { uploadFeedPhoto } from "@/lib/photo";
import { showToast } from "@/lib/toast/store";

// 임시: 게시판 전환 UI 시안. 고민 게시판 구현 전까지 자리만 잡아둔다.
const BOARDS = ["피드", "고민"] as const;
type Board = (typeof BOARDS)[number];

const SORTS = ["최신", "과거"] as const;
type Sort = (typeof SORTS)[number];

const SORT_VALUES: Record<Sort, FeedSort> = { 최신: "LATEST", 과거: "OLDEST" };
const SORT_LABELS: Record<FeedSort, Sort> = { LATEST: "최신", OLDEST: "과거" };

const WORRY_SORTS = ["최신", "공감"] as const;
type WorrySort = (typeof WORRY_SORTS)[number];

const ERROR_MESSAGE = "피드를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "피드가 없습니다.";
const POSTED_MESSAGE = "피드를 올렸습니다.";
const WORRY_COMPOSE_PENDING_MESSAGE = "고민 작성은 준비 중입니다.";

const STALE_POST_CODES = new Set(["FEED_002", "FEED_003"]);

export default function FeedScreen() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [board, setBoard] = useState<Board>("피드");
  const [composeOpen, setComposeOpen] = useState(false);
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const [filterOpen, setFilterOpen] = useState(false);
  const [worrySort, setWorrySort] = useState<WorrySort>("최신");
  const [worryFilterOpen, setWorryFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const listRef = useRef<FlatList<FeedPostResponse>>(null);
  const scrollTop = useScrollToTopVisible();
  const openCompose = useCallback(() => setComposeOpen(true), []);
  const openFilter = useCallback(() => setFilterOpen(true), []);
  const openWorryFilter = useCallback(() => setWorryFilterOpen(true), []);
  const openWorryCompose = useCallback(
    () => showToast("info", WORRY_COMPOSE_PENDING_MESSAGE),
    [],
  );

  const sort = useFeedFilterStore((state) => state.sort);
  const setSort = useFeedFilterStore((state) => state.setSort);
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
      headerLeft: () => <FeedNotificationButton />,
      headerRight: () => (
        <XStack>
          <HeaderIconButton
            icon={FunnelSimpleIcon}
            onPress={board === "피드" ? openFilter : openWorryFilter}
          />
          <HeaderIconButton
            icon={NotePencilIcon}
            onPress={board === "피드" ? openCompose : openWorryCompose}
          />
        </XStack>
      ),
    }),
    [board, openCompose, openFilter, openWorryCompose, openWorryFilter],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={BOARDS}
          value={board}
          onChange={setBoard}
        />
      </YStack>

      {board === "고민" ? (
        <ListEmpty>익명 고민 게시판이 여기에 들어갑니다.</ListEmpty>
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
        visible={board === "피드" && scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />

      {board === "피드" && (
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
          selected: label === worrySort,
          onPress: () => setWorrySort(label),
        }))}
      />

      {alertElement}
    </YStack>
  );
}
