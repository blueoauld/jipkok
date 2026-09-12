import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, type ScrollViewProps } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getTokens, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroListPanel } from "@/components/ui/RetroListPanel";
import { ScreenState } from "@/components/ui/ScreenState";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CommentScrollView } from "@/components/worry/CommentScrollView";
import { WorryCommentComposer } from "@/components/worry/WorryCommentComposer";
import { WorryCommentRow } from "@/components/worry/WorryCommentRow";
import { WorryPostSection } from "@/components/worry/WorryPostSection";
import { WorryReplyPreview } from "@/components/worry/WorryReplyPreview";
import { usePagedList } from "@/hooks/usePagedList";
import { usePullRefresh } from "@/hooks/usePullRefresh";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useWorryComments } from "@/hooks/useWorryComments";
import { useWorryDetailActions } from "@/hooks/useWorryDetailActions";
import { worryDetailKey } from "@/hooks/useWorryPosts";
import { api, type WorryCommentResponse } from "@/lib/api";

// 한 장이 20개이므로 1000개까지는 끝까지 받는다.
const MAX_DRAIN_PAGES = 50;

export default function WorryDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);
  const insets = useSafeAreaInsets();
  const { alertElement, show, showApiError, confirm } = useRetroAlert();

  const detail = useQuery({
    queryKey: worryDetailKey(postId),
    queryFn: () => api.worries.get(postId),
  });
  const post = detail.data;
  const {
    replyTo,
    setReplyTo,
    handleToggleLike,
    confirmRemovePost,
    confirmReportPost,
    confirmRemoveComment,
    confirmReportComment,
    submitComment,
    submittingComment,
  } = useWorryDetailActions(postId, { show, showApiError, confirm });

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

  const { refetch: refetchDetail } = detail;
  const { refreshing, onRefresh } = usePullRefresh(
    useCallback(
      () => Promise.all([refetchDetail(), refetchComments()]),
      [refetchDetail, refetchComments],
    ),
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

  const listRef = useRef<FlatList<WorryCommentResponse[]>>(null);
  const scrollPending = useRef(false);
  const { fetchNextPage } = commentsQuery;

  // 받아 온 댓글이 아직 그려지지 않아 여기서 바로 내리면 예전 높이로 자리를 잡는다.
  // 내용 높이가 바뀔 때 내려야 새 댓글이 있는 진짜 끝에 닿는다.
  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      if (!scrollPending.current) {
        return;
      }

      scrollPending.current = false;
      listRef.current?.scrollToOffset({ offset: height, animated: true });
    },
    [],
  );

  // 댓글은 오래된 순이라 새로 쓴 것은 맨 끝에 붙는데, 무효화는 이미 받아 둔 장만 다시
  // 받는다. 안 받은 장이 남아 있으면 내 댓글이 목록에 없어 실패로 보이고 다시 쓰게 된다.
  const handleSubmitComment = useCallback(
    async (text: string) => {
      await submitComment(text);

      // 다음 장이 없으면 fetchNextPage는 요청 없이 지금 것을 그대로 주므로 그냥 돌려도
      // 된다. 서버가 커서를 잘못 주면 끝나지 않으니 현실적인 길이 위쪽에서 끊는다.
      for (let page = 0; page <= MAX_DRAIN_PAGES; page++) {
        if (!(await fetchNextPage()).hasNextPage) {
          break;
        }
      }

      scrollPending.current = true;
    },
    [fetchNextPage, submitComment],
  );

  const renderComments = useCallback(
    ({ item }: { item: WorryCommentResponse[] }) => (
      <RetroListPanel>
        {item.map((comment, index) => (
          <WorryCommentRow
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
    [confirmRemoveComment, confirmReportComment, setReplyTo],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {post ? (
        <>
          <YStack flex={1}>
            <FlatList
              ref={listRef}
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
              onContentSizeChange={handleContentSizeChange}
              ListHeaderComponent={
                <YStack gap="$4">
                  <WorryPostSection
                    post={post}
                    onToggleLike={handleToggleLike}
                  />
                  <SectionLabel>
                    {t("worry.detail.commentSection")}
                  </SectionLabel>
                </YStack>
              }
              ListEmptyComponent={
                commentsQuery.isPending ? null : commentsError ? (
                  <ErrorState
                    message={t("worry.detail.commentError")}
                    onRetry={() => refetchComments()}
                  />
                ) : (
                  <ListEmpty>{t("worry.detail.commentEmpty")}</ListEmpty>
                )
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          </YStack>

          <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
            {replyTo && (
              <WorryReplyPreview
                replyTo={replyTo}
                onCancel={() => setReplyTo(null)}
              />
            )}

            <WorryCommentComposer
              replyTo={replyTo}
              pending={submittingComment}
              onSubmit={handleSubmitComment}
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
