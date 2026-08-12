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

import { FeedCard } from "@/components/FeedCard";
import { FeedComposeDialog } from "@/components/FeedComposeDialog";
import { FeedDatePicker } from "@/components/FeedDatePicker";
import { FeedNotificationButton } from "@/components/FeedNotificationButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { EmptyMessage } from "@/components/ui/EmptyMessage";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { ScreenState } from "@/components/ui/ScreenState";
import { feedPostsKey, useFeedPosts } from "@/hooks/useFeedPosts";
import { useMyProfile } from "@/hooks/useMyProfile";
import { usePagedList } from "@/hooks/usePagedList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import {
  SCROLL_EVENT_THROTTLE,
  useScrollToTopVisible,
} from "@/hooks/useScrollToTopVisible";
import {
  api,
  type FeedPostPage,
  type FeedPostResponse,
  type FeedSort,
} from "@/lib/api";
import { fromDateParam } from "@/lib/date";
import { useFeedFilterStore } from "@/lib/filter/store";
import {
  GENDER_FILTER_VALUES,
  GENDER_FILTERS,
  genderLabel,
} from "@/lib/member";
import { uploadFeedPhoto } from "@/lib/photo";

const FEEDS_KEY = ["feeds"];

const SORTS = ["최신", "과거"] as const;
type Sort = (typeof SORTS)[number];

const SORT_VALUES: Record<Sort, FeedSort> = { 최신: "LATEST", 과거: "OLDEST" };
const SORT_LABELS: Record<FeedSort, Sort> = { LATEST: "최신", OLDEST: "과거" };

const ERROR_MESSAGE = "피드를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "피드가 없습니다.";
const POSTED_MESSAGE = "피드를 올렸습니다.";
const REPORTED_MESSAGE = "신고가 접수되었습니다.";

export default function FeedScreen() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [composeOpen, setComposeOpen] = useState(false);
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const [genderOpen, setGenderOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const listRef = useRef<FlatList<FeedPostResponse>>(null);
  const scrollTop = useScrollToTopVisible();
  const openCompose = useCallback(() => setComposeOpen(true), []);
  const openGender = useCallback(() => setGenderOpen(true), []);

  const sort = useFeedFilterStore((state) => state.sort);
  const setSort = useFeedFilterStore((state) => state.setSort);
  const gender = useFeedFilterStore((state) => state.gender);
  const setGender = useFeedFilterStore((state) => state.setGender);
  const storedDate = useFeedFilterStore((state) => state.date);
  const setDate = useFeedFilterStore((state) => state.setDate);
  const date = useMemo(() => fromDateParam(storedDate), [storedDate]);
  const feed = useFeedPosts(date, gender, sort);
  const { posts, error, refetch: refetchFeed } = feed;
  const paged = usePagedList(feed);

  const queryKey = feedPostsKey(date, gender, sort);
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
          current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === post.postId
                  ? { ...item, likedByMe: !item.likedByMe }
                  : item,
              ),
            })),
          },
      );

      return { previous };
    },
    onError: (mutationError, _post, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      showApiError(mutationError);
    },
  });

  const report = useMutation({
    mutationFn: api.feeds.report,
    onSuccess: async () => {
      await invalidate();
      show("info", REPORTED_MESSAGE);
    },
    onError: showApiError,
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
      setComposeOpen(false);
      await invalidate();
      show("info", POSTED_MESSAGE);
    },
    onError: showApiError,
  });

  const screenOptions = useMemo(
    () => ({
      headerLeft: () => <FeedNotificationButton />,
      headerRight: () => (
        <XStack>
          <HeaderIconButton icon={FunnelSimpleIcon} onPress={openGender} />
          <HeaderIconButton icon={NotePencilIcon} onPress={openCompose} />
        </XStack>
      ),
    }),
    [openCompose, openGender],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$3">
        <RetroSegmentedControl
          values={SORTS}
          value={SORT_LABELS[sort]}
          onChange={(label) => {
            setSort(SORT_VALUES[label]);
            scrollToTop();
          }}
        />
      </YStack>

      {posts ? (
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
          ListEmptyComponent={
            <YStack items="center" py="$8">
              <EmptyMessage>{EMPTY_MESSAGE}</EmptyMessage>
            </YStack>
          }
        />
      ) : (
        <ScreenState
          error={error}
          message={ERROR_MESSAGE}
          onRetry={refetchFeed}
        />
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />

      <FeedDatePicker
        date={date}
        onChange={(selected) => {
          setDate(selected);
          scrollToTop();
        }}
      />

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
        open={genderOpen}
        onOpenChange={setGenderOpen}
        items={GENDER_FILTERS.map((label) => ({
          label,
          selected: label === (gender ? genderLabel(gender) : "전체"),
          onPress: () => {
            setGender(GENDER_FILTER_VALUES[label]);
            scrollToTop();
          },
        }))}
      />

      {alertElement}
    </YStack>
  );
}
