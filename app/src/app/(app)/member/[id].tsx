import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import type { Icon } from "phosphor-react-native";
import {
  ChatCircleIcon,
  DotsThreeIcon,
  HeartIcon,
  ImageIcon,
  ProhibitIcon,
  StarIcon,
} from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoPager } from "@/components/PhotoPager";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ProfileSection } from "@/components/ProfileSection";
import { TextInputDialog } from "@/components/TextInputDialog";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { memberDetailKey, useMemberDetail } from "@/hooks/useMemberDetail";
import { useNow } from "@/hooks/useNow";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useSecretPhotos } from "@/hooks/useSecretPhotos";
import { alertApiError, alertInfo } from "@/lib/alert";
import { api, isApiError, type MemberDetailResponse } from "@/lib/api";
import { FAVORITE_COLOR } from "@/lib/color";
import { formatRelativeTime } from "@/lib/date";
import { formatDistance, genderLabel } from "@/lib/member";
import { useNoteStore } from "@/lib/note/store";
import { pushOnce } from "@/lib/router";

const ACTION_ICON_SIZE = 30;
const ACTION_BAR_HEIGHT = ACTION_ICON_SIZE + 10 + 15 + 6;

const NOTE_MAX_LENGTH = 100;

const SECRET_PHOTO_EMPTY_MESSAGE = "공개된 비밀 사진이 없습니다.";

const NOTE_SENT_MESSAGE = "쪽지를 보냈습니다.";

const BADGE_SIZE = 18;
const BADGE_FONT_SIZE = 11;
const BADGE_OPACITY = 0.9;

const ERROR_MESSAGE = "프로필을 불러오지 못했습니다.";
const COMMENT_PLACEHOLDER = "코멘트가 없습니다.";
const BIO_PLACEHOLDER = "자기소개가 없습니다.";

const LIKES_KEY = ["likes"];
const FAVORITES_KEY = ["favorites"];
const SECRET_PHOTOS_KEY = ["secretPhotos"];
const BLOCKS_KEY = ["blocks"];

type Relation = { listKey: string[]; call: () => Promise<void> };

type ActionKey = "like" | "favorite" | "note" | "secretPhoto" | "block";

const ACTIONS: { key: ActionKey; icon: Icon }[] = [
  { key: "like", icon: HeartIcon },
  { key: "favorite", icon: StarIcon },
  { key: "note", icon: ChatCircleIcon },
  { key: "secretPhoto", icon: ImageIcon },
  { key: "block", icon: ProhibitIcon },
];

function CountBadge({ count }: { count: number }) {
  return (
    <XStack
      position="absolute"
      t={-BADGE_SIZE / 4}
      r={-BADGE_SIZE / 4}
      width={BADGE_SIZE}
      height={BADGE_SIZE}
      rounded={9999}
      bg={count > 0 ? "$red10" : "$gray10"}
      opacity={BADGE_OPACITY}
      items="center"
      justify="center"
    >
      <Text color="white" fontSize={BADGE_FONT_SIZE} fontWeight="700">
        {count}
      </Text>
    </XStack>
  );
}

function ActionBar({
  member,
  pending,
  onPress,
}: {
  member: MemberDetailResponse;
  pending: ActionKey | null;
  onPress: (key: ActionKey) => void;
}) {
  const theme = useTheme();

  const filled: Record<ActionKey, boolean> = {
    like: member.likedByMe,
    favorite: member.favoritedByMe,
    note: member.noteReceiveEnabled,
    secretPhoto: member.secretPhotoGrantedToMe,
    block: member.blockedByMe,
  };

  const colors: Record<ActionKey, string> = {
    like: theme.red10.val,
    favorite: FAVORITE_COLOR,
    note: theme.blue10.val,
    secretPhoto: theme.green10.val,
    block: theme.red10.val,
  };

  const disabled: Record<ActionKey, boolean> = {
    like: false,
    favorite: false,
    note: !member.noteReceiveEnabled,
    secretPhoto: false,
    block: false,
  };

  return (
    <XStack
      height={ACTION_BAR_HEIGHT}
      items="center"
      borderTopWidth={StyleSheet.hairlineWidth}
      borderColor="$borderColor"
    >
      {ACTIONS.map(({ key, icon: Icon }) => (
        <XStack
          key={key}
          flex={1}
          height="100%"
          items="center"
          justify="center"
          opacity={pending === key ? 0.4 : 1}
          pressStyle={disabled[key] ? undefined : { opacity: 0.6 }}
          onPress={disabled[key] ? undefined : () => onPress(key)}
        >
          <YStack>
            <Icon
              size={ACTION_ICON_SIZE}
              weight={filled[key] && key !== "block" ? "fill" : "regular"}
              color={filled[key] ? colors[key] : theme.color10.val}
            />

            {key === "secretPhoto" && (
              <CountBadge count={member.secretPhotoCount} />
            )}
          </YStack>
        </XStack>
      ))}
    </XStack>
  );
}

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const now = useNow();
  const queryClient = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [secretPhotoOpen, setSecretPhotoOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const noteContent = useNoteStore((state) => state.content);
  const setNoteContent = useNoteStore((state) => state.setContent);

  const { data: member, error, refetch } = useMemberDetail(memberId);
  const loadSecretPhotos = useSecretPhotos(memberId);
  const queryKey = memberDetailKey(memberId);

  const sendNote = useMutation({
    mutationFn: (content: string) => api.chats.sendNote(memberId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POINT_BALANCE_KEY });
      queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      alertInfo(NOTE_SENT_MESSAGE);
    },
    onError: alertApiError,
  });

  const relate = useMutation({
    mutationFn: ({ call }: Relation) => call(),
    onSuccess: (_data, { listKey }) =>
      queryClient.invalidateQueries({ queryKey: listKey }),
    onError: (mutationError) => {
      queryClient.invalidateQueries({ queryKey });
      alertApiError(mutationError);
    },
  });

  const run = useCallback(
    (
      changes: Partial<MemberDetailResponse>,
      listKey: string[],
      call: () => Promise<void>,
    ) => {
      queryClient.setQueryData<MemberDetailResponse>(
        queryKey,
        (current) => current && { ...current, ...changes },
      );
      relate.mutate({ listKey, call });
    },
    [queryClient, queryKey, relate],
  );

  const handleAction = useCallback(
    (key: ActionKey) => {
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
                ? alertInfo(SECRET_PHOTO_EMPTY_MESSAGE)
                : setSecretPhotoOpen(true),
          });
        }
        return;
      }

      if (key === "note") {
        setNoteOpen(true);
        return;
      }

      if (key === "block") {
        if (member.blockedByMe) {
          run({ blockedByMe: false }, BLOCKS_KEY, () =>
            api.blocks.remove(memberId),
          );
        } else {
          setBlockOpen(true);
        }
      }
    },
    [loadSecretPhotos, member, memberId, run],
  );

  const openMenu = useCallback(() => setMenuOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      title: "프로필",
      headerRight: () => (
        <HeaderCircleIconButton
          icon={DotsThreeIcon}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [openMenu],
  );

  const menuItems: MenuSheetItem[] = [
    {
      label: member?.secretPhotoGrantedByMe
        ? "비밀 사진 닫기"
        : "비밀 사진 공개",
      onPress: () => {
        if (member) {
          run(
            { secretPhotoGrantedByMe: !member.secretPhotoGrantedByMe },
            SECRET_PHOTOS_KEY,
            () =>
              member.secretPhotoGrantedByMe
                ? api.secretPhotos.remove(memberId)
                : api.secretPhotos.add(memberId),
          );
        }
      },
    },
    {
      label: "신고하기",
      destructive: true,
      onPress: () => pushOnce(`/report/${id}?type=member`),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {member ? (
        <>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <PhotoPager photos={member.publicPhotoUrls} />

            <YStack gap="$4" p="$4">
              <YStack gap="$1">
                <XStack items="center" justify="space-between" gap="$2">
                  <Text
                    flex={1}
                    numberOfLines={1}
                    fontSize="$6"
                    fontWeight="700"
                  >
                    {member.nickname}
                  </Text>

                  {member.locatedAt && (
                    <Text
                      shrink={0}
                      theme="gray"
                      color="$color10"
                      fontSize="$2"
                    >
                      {formatRelativeTime(member.locatedAt, now)}
                    </Text>
                  )}
                </XStack>

                <XStack items="center" justify="space-between" gap="$2">
                  <Text
                    flex={1}
                    numberOfLines={1}
                    theme="gray"
                    color="$color10"
                    fontSize="$4"
                  >
                    {`${genderLabel(member.gender)} · ${member.age}살 · ♥ ${member.receivedLikeCount}`}
                  </Text>

                  {member.distance !== undefined &&
                    member.distance !== null && (
                      <Text
                        shrink={0}
                        theme="gray"
                        color="$color10"
                        fontSize="$2"
                      >
                        {formatDistance(member.distance)}
                      </Text>
                    )}
                </XStack>
              </YStack>

              <ProfileSection
                title="코멘트"
                body={member.comment}
                placeholder={COMMENT_PLACEHOLDER}
              />

              <ProfileSection
                title="자기소개"
                body={member.bio}
                placeholder={BIO_PLACEHOLDER}
              />
            </YStack>
          </ScrollView>

          <ActionBar
            member={member}
            pending={loadSecretPhotos.isPending ? "secretPhoto" : null}
            onPress={handleAction}
          />
        </>
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {error ? (
            <>
              <Text color="$gray10" fontSize="$4" text="center">
                {isApiError(error) ? error.message : ERROR_MESSAGE}
              </Text>

              <Button
                size="$3"
                theme="blue"
                rounded="$7"
                onPress={() => refetch()}
              >
                다시 시도
              </Button>
            </>
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

      <ConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title="차단"
        description="차단하면 서로의 목록에 표시되지 않고, 주고받은 대화 내역도 모두 사라집니다."
        confirmLabel="확인"
        destructive
        onConfirm={() =>
          run({ blockedByMe: true }, BLOCKS_KEY, () => api.blocks.add(memberId))
        }
      />

      <TextInputDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title="쪽지"
        placeholder="내용 입력"
        maxLength={NOTE_MAX_LENGTH}
        defaultValue={noteContent}
        submitLabel="전송"
        onSubmit={(content) => {
          setNoteContent(content);
          sendNote.mutate(content);
        }}
      />

      <PhotoViewer
        photos={loadSecretPhotos.data ?? []}
        initialIndex={0}
        open={secretPhotoOpen}
        secret
        onClose={() => setSecretPhotoOpen(false)}
      />

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />
    </SafeAreaView>
  );
}
