import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ProfileSection } from "@/components/ProfileSection";
import { TextInputDialog } from "@/components/TextInputDialog";
import { memberDetailKey, useMemberDetail } from "@/hooks/useMemberDetail";
import { alertApiError } from "@/lib/alert";
import { api, isApiError, type MemberDetailResponse } from "@/lib/api";
import { formatRelativeTime } from "@/lib/date";
import { formatDistance, genderLabel } from "@/lib/member";
import { pushOnce } from "@/lib/router";

const ACTION_ICON_SIZE = 30;
const ACTION_BAR_HEIGHT = ACTION_ICON_SIZE + 10 + 15 + 6;

const NOTE_MAX_LENGTH = 100;

const ERROR_MESSAGE = "프로필을 불러오지 못했습니다.";
const COMMENT_PLACEHOLDER = "코멘트가 없습니다.";
const BIO_PLACEHOLDER = "자기소개가 없습니다.";

type ActionKey = "like" | "favorite" | "note" | "secretPhoto" | "block";

type ActionColor = "red10" | "yellow10" | "blue10" | "green10";

const ACTIONS: { key: ActionKey; icon: Icon; color: ActionColor }[] = [
  { key: "like", icon: HeartIcon, color: "red10" },
  { key: "favorite", icon: StarIcon, color: "yellow10" },
  { key: "note", icon: ChatCircleIcon, color: "blue10" },
  { key: "secretPhoto", icon: ImageIcon, color: "green10" },
  { key: "block", icon: ProhibitIcon, color: "red10" },
];

function ActionBar({
  member,
  onPress,
}: {
  member: MemberDetailResponse;
  onPress: (key: ActionKey) => void;
}) {
  const theme = useTheme();

  const filled: Record<ActionKey, boolean> = {
    like: member.likedByMe,
    favorite: member.favoritedByMe,
    note: false,
    secretPhoto: member.secretPhotoGrantedToMe,
    block: member.blockedByMe,
  };

  return (
    <XStack
      height={ACTION_BAR_HEIGHT}
      items="center"
      borderTopWidth={StyleSheet.hairlineWidth}
      borderColor="$borderColor"
    >
      {ACTIONS.map(({ key, icon: Icon, color }) => (
        <XStack
          key={key}
          flex={1}
          height="100%"
          items="center"
          justify="center"
          pressStyle={{ opacity: 0.6 }}
          onPress={() => onPress(key)}
        >
          <Icon
            size={ACTION_ICON_SIZE}
            weight={filled[key] && key !== "block" ? "fill" : "regular"}
            color={filled[key] ? theme[color].val : theme.color10.val}
          />
        </XStack>
      ))}
    </XStack>
  );
}

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const queryClient = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const { data: member, error, refetch } = useMemberDetail(memberId);
  const queryKey = memberDetailKey(memberId);

  const relate = useMutation({
    mutationFn: (call: () => Promise<void>) => call(),
    onError: (mutationError) => {
      queryClient.invalidateQueries({ queryKey });
      alertApiError(mutationError);
    },
  });

  const run = useCallback(
    (changes: Partial<MemberDetailResponse>, call: () => Promise<void>) => {
      queryClient.setQueryData<MemberDetailResponse>(
        queryKey,
        (current) => current && { ...current, ...changes },
      );
      relate.mutate(call);
    },
    [queryClient, queryKey, relate],
  );

  const handleAction = useCallback(
    (key: ActionKey) => {
      if (!member) {
        return;
      }

      if (key === "like") {
        run({ likedByMe: !member.likedByMe }, () =>
          member.likedByMe
            ? api.likes.remove(memberId)
            : api.likes.add(memberId),
        );
        return;
      }

      if (key === "favorite") {
        run({ favoritedByMe: !member.favoritedByMe }, () =>
          member.favoritedByMe
            ? api.favorites.remove(memberId)
            : api.favorites.add(memberId),
        );
        return;
      }

      if (key === "note") {
        setNoteOpen(true);
        return;
      }

      if (key === "block") {
        if (member.blockedByMe) {
          run({ blockedByMe: false }, () => api.blocks.remove(memberId));
        } else {
          setBlockOpen(true);
        }
      }
    },
    [member, memberId, run],
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
        ? "비밀 사진 공개 해제"
        : "비밀 사진 공개",
      onPress: () => {
        if (member) {
          run({ secretPhotoGrantedByMe: !member.secretPhotoGrantedByMe }, () =>
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
                      {formatRelativeTime(member.locatedAt)}
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

          <ActionBar member={member} onPress={handleAction} />
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
          run({ blockedByMe: true }, () => api.blocks.add(memberId))
        }
      />

      <TextInputDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title="쪽지"
        placeholder="내용 입력"
        maxLength={NOTE_MAX_LENGTH}
        submitLabel="전송"
        onSubmit={() => {}}
      />

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />
    </SafeAreaView>
  );
}
