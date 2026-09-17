import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import type { MemberActionKey } from "@/components/MemberActionBar";
import type { AlertApi } from "@/hooks/useAlert";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import { FEEDS_KEY } from "@/hooks/useFeedPosts";
import { memberDetailKey } from "@/hooks/useMemberDetail";
import { relationKey } from "@/hooks/useMemberList";
import { MEMBERS_KEY } from "@/hooks/useMembers";
import { MEMBER_SEARCH_KEY } from "@/hooks/useMemberSearch";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { PROFILE_VIEW_LIST_KEY } from "@/hooks/useProfileViews";
import { useSecretPhotos } from "@/hooks/useSecretPhotos";
import { APP_EVENT, type AppEventName, logAppEvent } from "@/lib/analytics";
import { api, type MemberDetailResponse } from "@/lib/api";
import { useLoadingOverlay } from "@/lib/overlay/store";

const LIKES_KEY = relationKey("likes");
const FAVORITES_KEY = relationKey("favorites");
const SECRET_PHOTOS_KEY = relationKey("secretPhotos");
const BLOCKS_KEY = relationKey("blocks");
// 차단하면 서버가 채팅방을 지우고 피드에서도 서로를 감춘다. 이벤트는 차단당한 쪽에만 간다.
const BLOCK_AFFECTED_KEYS = [
  BLOCKS_KEY,
  CHAT_ROOMS_KEY,
  CHAT_UNREAD_COUNT_KEY,
  FEEDS_KEY,
];
// 메모는 회원 요약을 쓰는 모든 목록에 실려 나온다. 상세는 직접 고치므로 목록만 고른다.
const MEMO_AFFECTED_KEYS = [
  MEMBERS_KEY,
  MEMBER_SEARCH_KEY,
  LIKES_KEY,
  FAVORITES_KEY,
  SECRET_PHOTOS_KEY,
  BLOCKS_KEY,
  CHAT_ROOMS_KEY,
  PROFILE_VIEW_LIST_KEY,
];

type Relation = {
  listKeys: string[][];
  call: () => Promise<void>;
  event?: AppEventName;
};

type AwaitedRelation = Relation & { successMessage: string };

export function useMemberActions(
  memberId: number,
  member: MemberDetailResponse | undefined,
  { show, showApiError, confirm }: AlertApi,
  {
    openNote,
    openSecretPhotos,
  }: { openNote: () => void; openSecretPhotos: () => void },
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const loadSecretPhotos = useSecretPhotos(memberId, showApiError);
  const queryKey = memberDetailKey(memberId);

  const sendNote = useMutation({
    mutationFn: (content: string) => api.members.sendNote(memberId, content),
    onSuccess: () => {
      logAppEvent(APP_EVENT.chatStarted);
      queryClient.invalidateQueries({ queryKey: POINT_BALANCE_KEY });
      queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      show(t("memberDetail.noteSent"));
    },
    onError: showApiError,
  });

  const updateMemo = useMutation({
    mutationFn: (content: string) => api.members.updateMemo(memberId, content),
    onSuccess: (_data, content) => {
      queryClient.setQueryData<MemberDetailResponse>(
        queryKey,
        (current) => current && { ...current, memo: content.trim() || null },
      );
      MEMO_AFFECTED_KEYS.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      show(t("memberDetail.memoSaved"));
    },
    onError: showApiError,
  });

  const invalidateAll = useCallback(
    (keys: string[][]) =>
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key })),
    [queryClient],
  );

  const relate = useMutation({
    mutationFn: ({ call }: Relation) => call(),
    onSuccess: (_data, { listKeys, event }) => {
      if (event) {
        logAppEvent(event);
      }

      invalidateAll(listKeys);
    },
    onError: (mutationError) => {
      queryClient.invalidateQueries({ queryKey });
      showApiError(mutationError);
    },
  });

  const relateAwaited = useMutation({
    mutationFn: ({ call }: AwaitedRelation) => call(),
    onSuccess: (_data, { listKeys, successMessage }) => {
      queryClient.invalidateQueries({ queryKey });
      invalidateAll(listKeys);
      show(successMessage);
    },
    onError: showApiError,
  });

  useLoadingOverlay(
    relateAwaited.isPending || sendNote.isPending || updateMemo.isPending,
  );

  const run = useCallback(
    (
      changes: Partial<MemberDetailResponse>,
      listKey: string[],
      call: () => Promise<void>,
      event?: AppEventName,
    ) => {
      queryClient.setQueryData<MemberDetailResponse>(
        queryKey,
        (current) => current && { ...current, ...changes },
      );
      relate.mutate({ listKeys: [listKey], call, event });
    },
    [queryClient, queryKey, relate],
  );

  const handleAction = useCallback(
    (key: MemberActionKey) => {
      if (!member) {
        return;
      }

      if (key === "like") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        run(
          {
            likedByMe: !member.likedByMe,
            receivedLikeCount:
              member.receivedLikeCount + (member.likedByMe ? -1 : 1),
          },
          LIKES_KEY,
          () =>
            member.likedByMe
              ? api.likes.remove(memberId)
              : api.likes.add(memberId),
          member.likedByMe ? undefined : APP_EVENT.memberLiked,
        );
        return;
      }

      if (key === "favorite") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        run({ favoritedByMe: !member.favoritedByMe }, FAVORITES_KEY, () =>
          member.favoritedByMe
            ? api.favorites.remove(memberId)
            : api.favorites.add(memberId),
        );
        return;
      }

      if (key === "secretPhoto") {
        if (!loadSecretPhotos.isPending) {
          loadSecretPhotos.mutate(undefined, {
            onSuccess: (photos) =>
              photos.length === 0
                ? show(t("memberDetail.secretPhotoEmpty"))
                : openSecretPhotos(),
          });
        }
        return;
      }

      if (key === "note") {
        openNote();
        return;
      }

      if (key === "block") {
        if (member.blockedByMe) {
          confirm({
            message: t("memberDetail.unblockConfirm"),
            confirmLabel: t("memberDetail.unblock"),
            onConfirm: () =>
              relateAwaited.mutate({
                listKeys: BLOCK_AFFECTED_KEYS,
                call: () => api.blocks.remove(memberId),
                successMessage: t("memberDetail.unblocked"),
              }),
          });
        } else {
          confirm({
            message: t("memberDetail.blockConfirm"),
            confirmLabel: t("memberDetail.block"),
            destructive: true,
            onConfirm: () =>
              relateAwaited.mutate({
                listKeys: BLOCK_AFFECTED_KEYS,
                call: () => api.blocks.add(memberId),
                successMessage: t("memberDetail.blocked"),
              }),
          });
        }
      }
    },
    [
      confirm,
      loadSecretPhotos,
      member,
      memberId,
      openNote,
      openSecretPhotos,
      relateAwaited,
      run,
      show,
      t,
    ],
  );

  const toggleSecretPhotoGrant = () => {
    if (member) {
      relateAwaited.mutate({
        listKeys: [SECRET_PHOTOS_KEY],
        call: () =>
          member.secretPhotoGrantedByMe
            ? api.secretPhotos.remove(memberId)
            : api.secretPhotos.add(memberId),
        successMessage: member.secretPhotoGrantedByMe
          ? t("memberDetail.secretPhotoClosed")
          : t("memberDetail.secretPhotoOpened"),
      });
    }
  };

  return {
    handleAction,
    toggleSecretPhotoGrant,
    loadSecretPhotos,
    sendNote: sendNote.mutate,
    updateMemo: updateMemo.mutate,
  };
}
