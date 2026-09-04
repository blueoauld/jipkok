import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RetroAlertApi } from "@/hooks/useRetroAlert";
import { worryCommentsKey } from "@/hooks/useWorryComments";
import { WORRY_LIST_KEY, worryDetailKey } from "@/hooks/useWorryPosts";
import {
  api,
  type WorryCommentResponse,
  type WorryPostPage,
  type WorryPostResponse,
} from "@/lib/api";
import { reportedMessage } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { mapPages } from "@/lib/paging";
import { showToast } from "@/lib/toast/store";

export function useWorryDetailActions(
  postId: number,
  { show, showApiError, confirm }: RetroAlertApi,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const detailKey = useMemo(() => worryDetailKey(postId), [postId]);
  const [replyTo, setReplyTo] = useState<WorryCommentResponse | null>(null);

  const invalidateList = useCallback(
    () => queryClient.invalidateQueries({ queryKey: WORRY_LIST_KEY }),
    [queryClient],
  );

  // 공감과 댓글 수는 아래 깔린 목록을 통째로 다시 받지 않고 이 글의 칸만 맞춘다.
  const syncListFromDetail = useCallback(() => {
    const detail = queryClient.getQueryData<WorryPostResponse>(detailKey);

    if (!detail) {
      return;
    }

    queryClient.setQueriesData<InfiniteData<WorryPostPage>>(
      { queryKey: WORRY_LIST_KEY },
      (current) =>
        mapPages(current, (items) =>
          items.map((item) =>
            item.worryId === postId
              ? {
                  ...item,
                  likeCount: detail.likeCount,
                  likedByMe: detail.likedByMe,
                  commentCount: detail.commentCount,
                }
              : item,
          ),
        ),
    );
  }, [detailKey, postId, queryClient]);

  const toggleLike = useMutation({
    mutationFn: (current: WorryPostResponse) =>
      current.likedByMe
        ? api.worries.cancelLike(postId)
        : api.worries.like(postId),
    onMutate: async (current) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<WorryPostResponse>(detailKey);

      queryClient.setQueryData<WorryPostResponse>(detailKey, {
        ...current,
        likedByMe: !current.likedByMe,
        likeCount: current.likeCount + (current.likedByMe ? -1 : 1),
      });

      return { previous };
    },
    onSuccess: syncListFromDetail,
    onError: (mutationError, _current, context) => {
      queryClient.setQueryData(detailKey, context?.previous);
      showApiError(mutationError);
    },
  });

  const removePost = useMutation({
    mutationFn: () => api.worries.remove(postId),
    onSuccess: async () => {
      await invalidateList();
      showToast("info", t("worry.detail.postDeleted"));
      router.back();
    },
    onError: showApiError,
  });

  const reportPost = useMutation({
    mutationFn: () => api.worries.report(postId),
    onSuccess: async () => {
      await invalidateList();
      show("info", reportedMessage(), () => router.back());
    },
    onError: showApiError,
  });

  const invalidateComments = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: worryCommentsKey(postId) }),
      queryClient.invalidateQueries({ queryKey: detailKey }),
    ]);
    syncListFromDetail();
  }, [detailKey, postId, queryClient, syncListFromDetail]);

  const createComment = useMutation({
    mutationFn: (text: string) =>
      api.worries.createComment(postId, text, replyTo?.commentId),
    onSuccess: async () => {
      setReplyTo(null);
      await invalidateComments();
    },
    onError: showApiError,
  });

  const removeComment = useMutation({
    mutationFn: (commentId: number) => api.worries.removeComment(commentId),
    onSuccess: async (_result, commentId) => {
      setReplyTo((current) =>
        current?.commentId === commentId ? null : current,
      );
      await invalidateComments();
      showToast("info", t("worry.detail.commentDeleted"));
    },
    onError: showApiError,
  });

  const reportComment = useMutation({
    mutationFn: (commentId: number) => api.worries.reportComment(commentId),
    onSuccess: async () => {
      await invalidateComments();
      show("info", reportedMessage());
    },
    onError: showApiError,
  });

  useLoadingOverlay(
    removePost.isPending || removeComment.isPending || reportComment.isPending,
  );

  const { mutate: removeCommentMutate } = removeComment;
  const { mutate: reportCommentMutate } = reportComment;

  const confirmRemoveComment = useCallback(
    (commentId: number) =>
      confirm({
        message: t("worry.detail.deleteCommentConfirm"),
        confirmLabel: t("action.delete"),
        destructive: true,
        onConfirm: () => removeCommentMutate(commentId),
      }),
    [confirm, removeCommentMutate, t],
  );

  const confirmReportComment = useCallback(
    (commentId: number) =>
      confirm({
        message: t("worry.detail.reportCommentConfirm"),
        confirmLabel: t("action.report"),
        destructive: true,
        onConfirm: () => reportCommentMutate(commentId),
      }),
    [confirm, reportCommentMutate, t],
  );

  const { mutate: toggleLikeMutate } = toggleLike;

  const handleToggleLike = useCallback(() => {
    const current = queryClient.getQueryData<WorryPostResponse>(detailKey);

    if (current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleLikeMutate(current);
    }
  }, [detailKey, queryClient, toggleLikeMutate]);

  const { mutate: removePostMutate } = removePost;
  const { mutate: reportPostMutate } = reportPost;

  const confirmRemovePost = useCallback(
    () =>
      confirm({
        message: t("worry.detail.deletePostConfirm"),
        confirmLabel: t("action.delete"),
        destructive: true,
        onConfirm: () => removePostMutate(),
      }),
    [confirm, removePostMutate, t],
  );

  const confirmReportPost = useCallback(
    () =>
      confirm({
        message: t("worry.detail.reportPostConfirm"),
        confirmLabel: t("action.report"),
        destructive: true,
        onConfirm: () => reportPostMutate(),
      }),
    [confirm, reportPostMutate, t],
  );

  return {
    replyTo,
    setReplyTo,
    handleToggleLike,
    confirmRemovePost,
    confirmReportPost,
    confirmRemoveComment,
    confirmReportComment,
    submitComment: createComment.mutateAsync,
    submittingComment: createComment.isPending,
  };
}
