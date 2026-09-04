import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, type ScrollViewProps } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getTokens, Text, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroListPanel } from "@/components/ui/RetroListPanel";
import { ScreenState } from "@/components/ui/ScreenState";
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
                  <WorryPostSection
                    post={post}
                    onToggleLike={handleToggleLike}
                  />
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
              onSubmit={submitComment}
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
