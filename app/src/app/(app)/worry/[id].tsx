import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { ArrowBendDownRightIcon } from "phosphor-react-native/src/icons/ArrowBendDownRight";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, type ScrollViewProps } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroListPanel, RetroListRow } from "@/components/ui/RetroListPanel";
import { RetroShadow } from "@/components/ui/RetroShadow";
import { ScreenState } from "@/components/ui/ScreenState";
import { CommentScrollView } from "@/components/worry/CommentScrollView";
import { WorryCategoryTag } from "@/components/worry/WorryCategoryTag";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { usePagedList } from "@/hooks/usePagedList";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWorryComments, worryCommentsKey } from "@/hooks/useWorryComments";
import { WORRY_LIST_KEY, worryDetailKey } from "@/hooks/useWorryPosts";
import {
  api,
  type WorryCommentResponse,
  type WorryPostResponse,
} from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import {
  DISABLED_OPACITY,
  KEYBOARD_OVERLAP,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";
import i18n from "@/lib/i18n";
import { reportedMessage } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { useAccentToken, useThemeBackground } from "@/lib/theme/accent";
import { showToast } from "@/lib/toast/store";
import { WORRY_COMMENT_MAX_LENGTH } from "@/lib/validation";

const COUNT_ICON_SIZE = 18;
const CANCEL_ICON_SIZE = 18;
const REPLY_ROW_ICON_SIZE = 18;
const REPLY_ICON_TOP = 2;
const REPLY_INDENT = "$5";
const REPLY_PREVIEW_GAP = 2;
const SUBMIT_BUTTON_WIDTH = 80;

function commentLabel(comment: WorryCommentResponse) {
  return comment.byAuthor
    ? i18n.t("worry.detail.author")
    : i18n.t("worry.detail.anonymousNo", { no: comment.anonymousNo });
}

function CountBadge({
  icon: BadgeIcon,
  value,
  active,
  onPress,
}: {
  icon: Icon;
  value: number;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      gap="$1.5"
      pressStyle={onPress ? { opacity: PRESS_OPACITY } : undefined}
      onPress={onPress}
    >
      <BadgeIcon
        size={COUNT_ICON_SIZE}
        weight={active ? "fill" : "bold"}
        color={active ? theme.red10.val : theme.gray11.val}
      />
      <Text theme="gray" color="$color11" fontSize="$3">
        {value}
      </Text>
    </XStack>
  );
}

function PostSection({
  post,
  onToggleLike,
}: {
  post: WorryPostResponse;
  onToggleLike: () => void;
}) {
  const { t } = useTranslation();
  const translation = useContentTranslation("WORRY_POST", post.worryId);

  return (
    <RetroCard
      gap="$2.5"
      onLongPress={() => copyText(post.content, t("worry.detail.postCopied"))}
    >
      <XStack items="center" justify="space-between">
        <XStack items="center" gap="$2">
          <WorryCategoryTag category={post.category} />
          <Text fontSize="$3" fontWeight="700">
            {post.mine ? t("worry.detail.mine") : t("worry.detail.anonymous")}
          </Text>
        </XStack>
        <RelativeTime at={post.createdAt} />
      </XStack>

      <Text fontSize="$4">{translation.contentOf(post.content)}</Text>

      <XStack items="center" justify="space-between">
        <XStack gap="$4">
          <CountBadge
            icon={HeartIcon}
            value={post.likeCount}
            active={post.likedByMe}
            onPress={onToggleLike}
          />
          <CountBadge icon={ChatCircleIcon} value={post.commentCount} />
        </XStack>

        <RowAction
          label={translation.label}
          disabled={translation.pending}
          onPress={translation.toggle}
        />
      </XStack>
    </RetroCard>
  );
}

function deletedPlaceholder(comment: WorryCommentResponse) {
  return comment.status === "REPORT_DELETED"
    ? i18n.t("worry.detail.reportDeletedComment")
    : i18n.t("worry.detail.deletedComment");
}

function RowAction({
  label,
  destructive,
  disabled,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <XStack
      pressStyle={disabled ? undefined : { opacity: PRESS_OPACITY }}
      onPress={disabled ? undefined : onPress}
    >
      <Text
        theme="gray"
        color={destructive ? "$red10" : "$color11"}
        fontSize="$3"
        fontWeight="600"
        opacity={disabled ? DISABLED_OPACITY : 1}
      >
        {label}
      </Text>
    </XStack>
  );
}

const CommentRow = memo(function CommentRow({
  comment,
  divider,
  onReply,
  onRemove,
  onReport,
}: {
  comment: WorryCommentResponse;
  divider: boolean;
  onReply: (comment: WorryCommentResponse) => void;
  onRemove: (commentId: number) => void;
  onReport: (commentId: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accentToken = useAccentToken();
  const active = comment.status === "ACTIVE";
  const reply = comment.parentId != null;
  const copyTarget = active ? comment.content : null;
  const translation = useContentTranslation("WORRY_COMMENT", comment.commentId);

  return (
    <RetroListRow
      divider={divider}
      pl={reply ? REPLY_INDENT : "$4"}
      gap="$2.5"
      onLongPress={
        copyTarget
          ? () => copyText(copyTarget, t("worry.detail.commentCopied"))
          : undefined
      }
      // 꾹 눌러 복사하는 것뿐이라 누른 것처럼 보일 필요가 없다.
      pressStyle={undefined}
    >
      {reply && (
        <YStack self="flex-start" mt={REPLY_ICON_TOP}>
          <ArrowBendDownRightIcon
            size={REPLY_ROW_ICON_SIZE}
            weight="bold"
            color={theme.gray11.val}
          />
        </YStack>
      )}

      <YStack flex={1} gap="$1.5">
        <XStack items="center" justify="space-between">
          <Text
            fontSize="$3"
            fontWeight="700"
            color={comment.byAuthor ? accentToken : "$color12"}
          >
            {commentLabel(comment)}
          </Text>
          <RelativeTime at={comment.createdAt} />
        </XStack>

        {active ? (
          <Text fontSize="$4">{translation.contentOf(comment.content)}</Text>
        ) : (
          <Text theme="gray" color="$color11" fontSize="$4">
            {deletedPlaceholder(comment)}
          </Text>
        )}

        {active && (
          <XStack self="flex-end" gap="$4">
            <RowAction
              label={translation.label}
              disabled={translation.pending}
              onPress={translation.toggle}
            />
            {!reply && (
              <RowAction
                label={t("worry.detail.reply")}
                onPress={() => onReply(comment)}
              />
            )}
            {comment.mine ? (
              <RowAction
                label={t("action.delete")}
                destructive
                onPress={() => onRemove(comment.commentId)}
              />
            ) : (
              <RowAction
                label={t("action.report")}
                destructive
                onPress={() => onReport(comment.commentId)}
              />
            )}
          </XStack>
        )}
      </YStack>
    </RetroListRow>
  );
});

function CommentComposer({
  replyTo,
  pending,
  onSubmit,
}: {
  replyTo: WorryCommentResponse | null;
  pending: boolean;
  onSubmit: (content: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const background = useThemeBackground();
  const [content, setContent] = useState("");

  const trimmed = content.trim();

  return (
    <XStack
      px="$4"
      pt="$3"
      pb={getTokens().space.$3.val + KEYBOARD_OVERLAP}
      mb={-KEYBOARD_OVERLAP}
      gap="$3"
      items="center"
      bg={background}
    >
      <YStack flex={1}>
        {/* 답글 대상이 바뀔 때 입력창을 새로 띄워 키보드를 함께 연다. */}
        <RetroInput
          key={replyTo?.commentId ?? "comment"}
          shadow="$gray12"
          value={content}
          onChangeText={setContent}
          autoFocusNative={replyTo !== null}
          placeholder={
            replyTo
              ? t("worry.detail.replyPlaceholder")
              : t("worry.detail.commentPlaceholder")
          }
          maxLength={WORRY_COMMENT_MAX_LENGTH}
        />
      </YStack>
      <RetroButton
        width={SUBMIT_BUTTON_WIDTH}
        disabled={!trimmed || pending}
        onPress={() => {
          setContent("");
          onSubmit(trimmed).catch(() => setContent(trimmed));
        }}
      >
        {pending ? (
          <Spinner size="small" color="white" />
        ) : (
          t("worry.detail.submit")
        )}
      </RetroButton>
    </XStack>
  );
}

export default function WorryDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const background = useThemeBackground();
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const [replyTo, setReplyTo] = useState<WorryCommentResponse | null>(null);

  const detailKey = useMemo(() => worryDetailKey(postId), [postId]);
  const detail = useQuery({
    queryKey: detailKey,
    queryFn: () => api.worries.get(postId),
  });
  const post = detail.data;

  const commentsQuery = useWorryComments(postId);
  const {
    comments,
    error: commentsError,
    refetch: refetchComments,
  } = commentsQuery;
  const paged = usePagedList(commentsQuery);
  // 프로필처럼 라벨과 내용은 붙이고, 글과 라벨 사이만 벌린다.
  const listStyle = useMemo(
    () => ({
      ...paged.contentContainerStyle,
      gap: getTokens().space.$2.val,
    }),
    [paged.contentContainerStyle],
  );

  const invalidateList = useCallback(
    () => queryClient.invalidateQueries({ queryKey: WORRY_LIST_KEY }),
    [queryClient],
  );

  const { refetch: refetchDetail } = detail;
  const { refreshing, onRefresh } = usePullRefresh(
    useCallback(
      () => Promise.all([refetchDetail(), refetchComments()]),
      [refetchDetail, refetchComments],
    ),
  );

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
    onSuccess: () => invalidateList(),
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

  const invalidateComments = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: worryCommentsKey(postId) }),
        queryClient.invalidateQueries({ queryKey: detailKey }),
        invalidateList(),
      ]),
    [detailKey, invalidateList, postId, queryClient],
  );

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

  const screenOptions = useMemo(
    () => ({
      title: t("worry.detail.title"),
      headerRight: post
        ? () => (
            <HeaderSoloIconButton
              icon={post.mine ? TrashIcon : SirenIcon}
              label={post.mine ? t("action.delete") : t("a11y.report")}
              onPress={post.mine ? confirmRemovePost : confirmReportPost}
            />
          )
        : undefined,
    }),
    [confirmRemovePost, confirmReportPost, post, t],
  );

  const listData = useMemo(
    () => (comments && comments.length > 0 ? [comments] : []),
    [comments],
  );

  const renderComments = useCallback(
    ({ item }: { item: WorryCommentResponse[] }) => (
      <RetroListPanel>
        {item.map((comment, index) => (
          <CommentRow
            key={comment.commentId}
            comment={comment}
            divider={index < item.length - 1}
            onReply={setReplyTo}
            onRemove={confirmRemoveComment}
            onReport={confirmReportComment}
          />
        ))}
      </RetroListPanel>
    ),
    [confirmRemoveComment, confirmReportComment],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {post ? (
        <>
          <YStack flex={1}>
            <FlatList
              {...paged}
              contentContainerStyle={listStyle}
              data={listData}
              keyExtractor={() => "comments"}
              renderItem={renderComments}
              renderScrollComponent={(scrollProps: ScrollViewProps) => (
                <CommentScrollView {...scrollProps} offset={insets.bottom} />
              )}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <YStack gap="$4">
                  <PostSection post={post} onToggleLike={handleToggleLike} />
                  <Text
                    theme="gray"
                    color="$color11"
                    fontSize="$3"
                    fontWeight="600"
                  >
                    {t("worry.detail.commentSection")}
                  </Text>
                </YStack>
              }
              ListEmptyComponent={
                commentsQuery.isPending ? null : (
                  <ListEmpty>
                    {commentsError
                      ? t("worry.detail.commentError")
                      : t("worry.detail.commentEmpty")}
                  </ListEmpty>
                )
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          </YStack>

          <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
            {replyTo && (
              <YStack px="$4" pt="$3" bg={background}>
                {/* 그림자가 아래로 넘치므로 그만큼 띄워야 입력줄에 안 가린다. */}
                <YStack theme="gray" mb={RETRO_SHADOW_OFFSET}>
                  <RetroShadow color="$gray12" />
                  <XStack
                    borderWidth={RETRO_BORDER_WIDTH}
                    borderColor="$gray12"
                    bg="$color1"
                    items="center"
                    pl="$3"
                    pr="$2"
                    py="$2"
                    gap="$2.5"
                  >
                    <YStack flex={1} gap={REPLY_PREVIEW_GAP}>
                      <Text fontSize="$2" fontWeight="600" color="$color12">
                        {t("worry.detail.replyTo", {
                          name: commentLabel(replyTo),
                        })}
                      </Text>
                      <Text fontSize="$3" color="$color11" numberOfLines={1}>
                        {replyTo.content}
                      </Text>
                    </YStack>

                    <XStack
                      p="$2"
                      pressStyle={{ opacity: PRESS_OPACITY }}
                      onPress={() => setReplyTo(null)}
                    >
                      <XIcon
                        size={CANCEL_ICON_SIZE}
                        color={theme.color12.val}
                      />
                    </XStack>
                  </XStack>
                </YStack>
              </YStack>
            )}

            <CommentComposer
              replyTo={replyTo}
              pending={createComment.isPending}
              onSubmit={createComment.mutateAsync}
            />
          </KeyboardStickyView>
        </>
      ) : (
        <ScreenState
          error={detail.error}
          message={t("worry.loadFailed")}
          onRetry={detail.refetch}
        />
      )}

      {alertElement}
    </SafeAreaView>
  );
}
