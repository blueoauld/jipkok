import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroListPanel, RetroListRow } from "@/components/ui/RetroListPanel";
import { ScreenState } from "@/components/ui/ScreenState";
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
import { PRESS_OPACITY } from "@/lib/design";
import { REPORTED_MESSAGE } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { useAccentToken, useThemeBackground } from "@/lib/theme/accent";
import { showToast } from "@/lib/toast/store";

const COMMENT_MAX_LENGTH = 200;
const COUNT_ICON_SIZE = 18;

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
        <Text fontSize="$3" fontWeight="700">
          {post.mine ? "내 고민" : "익명"}
        </Text>
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

function CommentRow({
  comment,
  divider,
  onLongPress,
}: {
  comment: WorryCommentResponse;
  divider: boolean;
  onLongPress: (comment: WorryCommentResponse) => void;
}) {
  const accentToken = useAccentToken();
  const active = comment.status === "ACTIVE";

  return (
    <RetroListRow
      divider={divider}
      pressStyle={active ? { bg: "$color3" } : undefined}
      onLongPress={active ? () => onLongPress(comment) : undefined}
    >
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
      </YStack>
    </RetroListRow>
  );
}

export default function WorryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const background = useThemeBackground();
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const [content, setContent] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedComment, setSelectedComment] =
    useState<WorryCommentResponse | null>(null);

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
    mutationFn: (text: string) => api.worries.createComment(postId, text),
    onSuccess: async () => {
      setContent("");
      await invalidateComments();
    },
    onError: showApiError,
  });

  const removeComment = useMutation({
    mutationFn: (commentId: number) => api.worries.removeComment(commentId),
    onSuccess: async () => {
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
        message: "지운 고민은 되돌릴 수 없습니다.",
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
                      onLongPress={setSelectedComment}
                    />
                  ))}
                </RetroListPanel>
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
            <XStack px="$4" py="$3" gap="$3" items="center" bg={background}>
              <YStack flex={1}>
                <RetroInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="댓글 입력"
                  maxLength={COMMENT_MAX_LENGTH}
                />
              </YStack>
              <RetroButton
                disabled={!trimmed || createComment.isPending}
                onPress={() => createComment.mutate(trimmed)}
              >
                등록
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

      <MenuSheet
        open={selectedComment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedComment(null);
          }
        }}
        items={
          selectedComment
            ? selectedComment.mine
              ? [
                  {
                    label: "삭제",
                    destructive: true,
                    onPress: () =>
                      removeComment.mutate(selectedComment.commentId),
                  },
                ]
              : [
                  {
                    label: "신고",
                    destructive: true,
                    onPress: () =>
                      reportComment.mutate(selectedComment.commentId),
                  },
                ]
            : []
        }
      />

      {alertElement}
    </SafeAreaView>
  );
}
