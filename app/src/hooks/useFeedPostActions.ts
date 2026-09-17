import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import type { ImagePickerAsset } from "expo-image-picker";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { AlertApi } from "@/hooks/useAlert";
import { FEEDS_KEY } from "@/hooks/useFeedPosts";
import { APP_EVENT, logAppEvent } from "@/lib/analytics";
import {
  api,
  type FeedPostPage,
  type FeedPostResponse,
  isApiError,
} from "@/lib/api";
import { reportedMessage } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { mapPages } from "@/lib/paging";
import { uploadFeedPhoto } from "@/lib/photo";
import { showToast } from "@/lib/toast/store";

const STALE_POST_CODES = new Set(["FEED_002", "FEED_003"]);

// 라운지 피드 글에 하는 좋아요, 신고, 작성이다. queryKey는 보고 있는 날짜와 정렬의 목록이다.
export function useFeedPostActions({
  queryKey,
  alert: { show, showApiError, confirm },
  onComposed,
}: {
  queryKey: string[];
  alert: AlertApi;
  onComposed: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: FEEDS_KEY }),
    [queryClient],
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

  const setLiked = useCallback(
    (key: string[], postId: number, liked: boolean) =>
      queryClient.setQueryData<InfiniteData<FeedPostPage>>(key, (current) =>
        mapPages(current, (items) =>
          items.map((item) =>
            item.postId === postId ? { ...item, likedByMe: liked } : item,
          ),
        ),
      ),
    [queryClient],
  );

  const toggleLike = useMutation({
    mutationFn: (post: FeedPostResponse) =>
      post.likedByMe
        ? api.feeds.cancelLike(post.postId)
        : api.feeds.like(post.postId),
    // 아직 한 번도 받지 못한 키를 cancelQueries로 끊으면 그 쿼리가 pending으로 굳어
    // 아무도 다시 받지 않는다. 캐시가 없으면 낙관적 패치도 어차피 무의미하다.
    onMutate: async (post) => {
      if (!queryClient.getQueryData(queryKey)) {
        return undefined;
      }

      await queryClient.cancelQueries({ queryKey });
      setLiked(queryKey, post.postId, !post.likedByMe);

      return { key: queryKey, liked: post.likedByMe };
    },
    // 되돌릴 때는 onMutate가 잡아둔 키를 쓴다. 그 사이 날짜나 정렬이 바뀌었으면 렌더
    // 시점 queryKey는 다른 목록을 가리킨다. 목록 전체가 아니라 이 글만 되돌린다.
    onError: (mutationError, post, context) => {
      if (context) {
        setLiked(context.key, post.postId, context.liked);
      }

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

  const compose = useMutation({
    mutationFn: async ({
      photo,
      caption,
    }: {
      photo: ImagePickerAsset;
      caption: string;
    }) => {
      const objectKey = await uploadFeedPhoto(photo);

      await api.feeds.create({ objectKey, caption: caption.trim() || null });
    },
    onSuccess: async () => {
      logAppEvent(APP_EVENT.feedPostCreated);
      onComposed();
      await invalidate();
      showToast("info", t("feed.posted"));
    },
    onError: showApiError,
  });

  useLoadingOverlay(report.isPending);

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

  return { toggleLike: handleToggleLike, report: handleReport, compose };
}
