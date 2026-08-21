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
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, type ScrollViewProps } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getTokens, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroListPanel, RetroListRow } from "@/components/ui/RetroListPanel";
import { RetroShadow } from "@/components/ui/RetroShadow";
import { ScreenState } from "@/components/ui/ScreenState";
import { CommentScrollView } from "@/components/worry/CommentScrollView";
import { WorryCategoryTag } from "@/components/worry/WorryCategoryTag";
import { usePagedList } from "@/hooks/usePagedList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWorryComments, worryCommentsKey } from "@/hooks/useWorryComments";
import { WORRY_LIST_KEY, worryDetailKey } from "@/hooks/useWorryPosts";
import {
  api,
  type WorryCommentResponse,
  type WorryPostResponse,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/date";
import {
  KEYBOARD_OVERLAP,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET,
} from "@/lib/design";
import { REPORTED_MESSAGE } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { useAccentToken, useThemeBackground } from "@/lib/theme/accent";
import { showToast } from "@/lib/toast/store";

const COMMENT_MAX_LENGTH = 200;
const COUNT_ICON_SIZE = 18;
const CANCEL_ICON_SIZE = 18;
const REPLY_ROW_ICON_SIZE = 18;
const REPLY_ICON_TOP = 2;
const REPLY_INDENT = "$5";
const REPLY_PREVIEW_GAP = 2;
const SUBMIT_BUTTON_WIDTH = 80;

const ERROR_MESSAGE = "고민을 불러오지 못했습니다.";
const COMMENT_EMPTY_MESSAGE = "첫 댓글을 남겨보세요.";
const COMMENT_ERROR_MESSAGE = "댓글을 불러오지 못했습니다.";
const POST_DELETED_MESSAGE = "고민을 지웠습니다.";
const COMMENT_DELETED_MESSAGE = "댓글을 지웠습니다.";
const DELETED_COMMENT_PLACEHOLDER = "삭제된 댓글입니다.";
const REPORT_DELETED_COMMENT_PLACEHOLDER = "신고 누적으로 삭제된 댓글입니다.";

function commentLabel(comment: WorryCommentResponse) {
  return comment.byAuthor ? "글쓴이" : `익명${comment.anonymousNo}`;
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
  return (
    <RetroCard gap="$2.5">
      <XStack items="center" justify="space-between">
        <XStack items="center" gap="$2">
          <WorryCategoryTag category={post.category} />
          <Text fontSize="$3" fontWeight="700">
            {post.mine ? "내 고민" : "익명"}
          </Text>
        </XStack>
        <Text theme="gray" color="$color11" fontSize="$2">
          {formatRelativeTime(post.createdAt)}
        </Text>
      </XStack>

      <Text fontSize="$4">{post.content}</Text>

      <XStack gap="$4">
        <CountBadge
          icon={HeartIcon}
          value={post.likeCount}
          active={post.likedByMe}
          onPress={onToggleLike}
        />
        <CountBadge icon={ChatCircleIcon} value={post.commentCount} />
      </XStack>
    </RetroCard>
  );
}

function deletedPlaceholder(comment: WorryCommentResponse) {
  return comment.status === "REPORT_DELETED"
    ? REPORT_DELETED_COMMENT_PLACEHOLDER
    : DELETED_COMMENT_PLACEHOLDER;
}

function RowAction({
  label,
  destructive,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <XStack pressStyle={{ opacity: PRESS_OPACITY }} onPress={onPress}>
      <Text
        theme="gray"
        color={destructive ? "$red10" : "$color11"}
        fontSize="$3"
        fontWeight="600"
      >
        {label}
      </Text>
    </XStack>
  );
}

function CommentRow({
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
  const theme = useTheme();
  const accentToken = useAccentToken();
  const active = comment.status === "ACTIVE";
  const reply = comment.parentId != null;

  return (
    <RetroListRow divider={divider} pl={reply ? REPLY_INDENT : "$4"} gap="$2.5">
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
          <Text theme="gray" color="$color11" fontSize="$2">
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </XStack>

        {active ? (
          <Text fontSize="$4">{comment.content}</Text>
        ) : (
          <Text theme="gray" color="$color11" fontSize="$4">
            {deletedPlaceholder(comment)}
          </Text>
        )}

        {active && (
          <XStack self="flex-end" gap="$4">
            {!reply && (
              <RowAction label="답글" onPress={() => onReply(comment)} />
            )}
            {comment.mine ? (
              <RowAction
                label="삭제"
                destructive
                onPress={() => onRemove(comment.commentId)}
              />
            ) : (
              <RowAction
                label="신고"
                destructive
                onPress={() => onReport(comment.commentId)}
              />
            )}
          </XStack>
        )}
      </YStack>
    </RetroListRow>
  );
}

export default function WorryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const background = useThemeBackground();
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const [content, setContent] = useState("");
  const [refreshing, setRefreshing] = useState(false);
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

  const invalidateList = useCallback(
    () => queryClient.invalidateQueries({ queryKey: WORRY_LIST_KEY }),
    [queryClient],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([detail.refetch(), refetchComments()]);
    } finally {
      setRefreshing(false);
    }
  }, [detail, refetchComments]);

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
      showToast("info", POST_DELETED_MESSAGE);
      router.back();
    },
    onError: showApiError,
  });

  const reportPost = useMutation({
    mutationFn: () => api.worries.report(postId),
    onSuccess: async () => {
      await invalidateList();
      show("info", REPORTED_MESSAGE, () => router.back());
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
      setContent("");
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
      showToast("info", COMMENT_DELETED_MESSAGE);
    },
    onError: showApiError,
  });

  const reportComment = useMutation({
    mutationFn: (commentId: number) => api.worries.reportComment(commentId),
    onSuccess: async () => {
      await invalidateComments();
      show("info", REPORTED_MESSAGE);
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
        message: "지운 댓글은 되돌릴 수 없습니다.",
        confirmLabel: "삭제",
        destructive: true,
        onConfirm: () => removeCommentMutate(commentId),
      }),
    [confirm, removeCommentMutate],
  );

  const confirmReportComment = useCallback(
    (commentId: number) =>
      confirm({
        message: "신고한 댓글은 검토 후 조치됩니다.",
        confirmLabel: "신고",
        destructive: true,
        onConfirm: () => reportCommentMutate(commentId),
      }),
    [confirm, reportCommentMutate],
  );

  const { mutate: toggleLikeMutate } = toggleLike;

  const handleToggleLike = useCallback(() => {
    const current = queryClient.getQueryData<WorryPostResponse>(detailKey);

    if (current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleLikeMutate(current);
    }
  }, [detailKey, queryClient, toggleLikeMutate]);

  const confirmRemovePost = useCallback(
    () =>
      confirm({
        message: "삭제한 고민은 되돌릴 수 없습니다.",
        confirmLabel: "삭제",
        destructive: true,
        onConfirm: () => removePost.mutate(),
      }),
    [confirm, removePost],
  );

  const confirmReportPost = useCallback(
    () =>
      confirm({
        message: "신고한 고민은 검토 후 조치됩니다.",
        confirmLabel: "신고",
        destructive: true,
        onConfirm: () => reportPost.mutate(),
      }),
    [confirm, reportPost],
  );

  const screenOptions = useMemo(
    () => ({
      title: "고민",
      headerRight: post
        ? () => (
            <HeaderSoloIconButton
              icon={post.mine ? TrashIcon : SirenIcon}
              onPress={post.mine ? confirmRemovePost : confirmReportPost}
            />
          )
        : undefined,
    }),
    [confirmRemovePost, confirmReportPost, post],
  );

  const trimmed = content.trim();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {post ? (
        <>
          <YStack flex={1}>
            <FlatList
              {...paged}
              data={comments && comments.length > 0 ? [comments] : []}
              keyExtractor={() => "comments"}
              renderItem={({ item }) => (
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
              )}
              renderScrollComponent={(scrollProps: ScrollViewProps) => (
                <CommentScrollView {...scrollProps} offset={insets.bottom} />
              )}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <PostSection post={post} onToggleLike={handleToggleLike} />
              }
              ListEmptyComponent={
                commentsQuery.isPending ? null : (
                  <ListEmpty>
                    {commentsError
                      ? COMMENT_ERROR_MESSAGE
                      : COMMENT_EMPTY_MESSAGE}
                  </ListEmpty>
                )
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={refresh} />
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
                        {`${commentLabel(replyTo)}에게 답글`}
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
                  placeholder={replyTo ? "답글 입력" : "댓글 입력"}
                  maxLength={COMMENT_MAX_LENGTH}
                />
              </YStack>
              <RetroButton
                width={SUBMIT_BUTTON_WIDTH}
                disabled={!trimmed || createComment.isPending}
                onPress={() => createComment.mutate(trimmed)}
              >
                {createComment.isPending ? (
                  <Spinner size="small" color="white" />
                ) : (
                  "등록"
                )}
              </RetroButton>
            </XStack>
          </KeyboardStickyView>
        </>
      ) : (
        <ScreenState
          error={detail.error}
          message={ERROR_MESSAGE}
          onRetry={detail.refetch}
        />
      )}

      {alertElement}
    </SafeAreaView>
  );
}
