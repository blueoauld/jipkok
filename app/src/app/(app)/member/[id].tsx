import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { useCallback, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoPager } from "@/components/PhotoPager";
import { PhotoViewer } from "@/components/PhotoViewer";
import { ProfileSection } from "@/components/ProfileSection";
import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/components/ScrollToTopButton";
import { TextInputDialog } from "@/components/TextInputDialog";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroFloatingButton } from "@/components/ui/RetroFloatingButton";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { memberDetailKey, useMemberDetail } from "@/hooks/useMemberDetail";
import { useNow } from "@/hooks/useNow";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useSecretPhotos } from "@/hooks/useSecretPhotos";
import { api, isApiError, type MemberDetailResponse } from "@/lib/api";
import { FAVORITE_COLOR } from "@/lib/color";
import { formatRelativeTime } from "@/lib/date";
import { TAB_BAR_HEIGHT, tabBarOverlayHeight } from "@/lib/design";
import { formatDistance, genderLabel } from "@/lib/member";
import { useNoteStore } from "@/lib/note/store";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { usePhotoGridStore } from "@/lib/photo-grid/store";
import { pushOnce } from "@/lib/router";

const ACTION_ICON_SIZE = 30;
const LIKE_ICON_SIZE = 14;

const NOTE_MAX_LENGTH = 100;

const SECRET_PHOTO_EMPTY_MESSAGE = "공개된 비밀 사진이 없습니다.";
const ID_COPIED_MESSAGE = "회원 아이디를 복사했습니다.";

const NOTE_SENT_MESSAGE = "쪽지를 보냈습니다.";

const BLOCKED_MESSAGE = "차단했습니다.";
const UNBLOCKED_MESSAGE = "차단이 해제되었습니다.";
const SECRET_PHOTO_OPENED_MESSAGE = "비밀 사진을 공개했습니다.";
const SECRET_PHOTO_CLOSED_MESSAGE = "비밀 사진을 닫았습니다.";

const BADGE_SIZE = 18;
const BADGE_FONT_SIZE = 11;
const BADGE_OPACITY = 0.9;

const ERROR_MESSAGE = "프로필을 불러오지 못했습니다.";
const COMMENT_PLACEHOLDER = "코멘트가 없습니다.";
const BIO_PLACEHOLDER = "자기소개가 없습니다.";

const UNBLOCK_DESCRIPTION = "차단을 해제하시겠습니까?";
const BLOCK_DESCRIPTION =
  "차단하면 서로의 목록에 표시되지 않고, 주고받은 대화 내역도 모두 사라집니다.";

const GRID_ICON_SIZE = 20;

const LIKES_KEY = ["likes"];
const FAVORITES_KEY = ["favorites"];
const SECRET_PHOTOS_KEY = ["secretPhotos"];
const BLOCKS_KEY = ["blocks"];

type Relation = { listKey: string[]; call: () => Promise<void> };

type AwaitedRelation = Relation & { successMessage: string };

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
  const insets = useSafeAreaInsets();

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
      position="absolute"
      b={0}
      l={0}
      r={0}
      height={TAB_BAR_HEIGHT + insets.bottom}
      pb={insets.bottom}
      bg="$color1"
      borderTopWidth={2}
      borderColor="$color12"
    >
      {ACTIONS.map(({ key, icon: Icon }) => (
        <XStack
          key={key}
          flex={1}
          height="100%"
          items="center"
          justify="center"
          opacity={pending === key || disabled[key] ? 0.4 : 1}
          onPress={disabled[key] ? undefined : () => onPress(key)}
        >
          <YStack>
            <Icon
              size={ACTION_ICON_SIZE}
              weight={filled[key] && key !== "block" ? "fill" : "regular"}
              color={filled[key] ? colors[key] : theme.color12.val}
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [gridPhotoIndex, setGridPhotoIndex] = useState<number | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [secretPhotoOpen, setSecretPhotoOpen] = useState(false);

  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const photoGridOpen = usePhotoGridStore((state) => state.open);
  const togglePhotoGrid = usePhotoGridStore((state) => state.toggle);
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
      show("info", NOTE_SENT_MESSAGE);
    },
    onError: showApiError,
  });

  const relate = useMutation({
    mutationFn: ({ call }: Relation) => call(),
    onSuccess: (_data, { listKey }) =>
      queryClient.invalidateQueries({ queryKey: listKey }),
    onError: (mutationError) => {
      queryClient.invalidateQueries({ queryKey });
      showApiError(mutationError);
    },
  });

  const relateAwaited = useMutation({
    mutationFn: ({ call }: AwaitedRelation) => call(),
    onSuccess: (_data, { listKey, successMessage }) => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: listKey });
      show("info", successMessage);
    },
    onError: showApiError,
  });

  useLoadingOverlay(relateAwaited.isPending);

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

  const copyMemberId = async (id: number) => {
    await Clipboard.setStringAsync(String(id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    show("info", ID_COPIED_MESSAGE);
  };

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
                ? show("info", SECRET_PHOTO_EMPTY_MESSAGE)
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
          confirm({
            message: UNBLOCK_DESCRIPTION,
            confirmLabel: "해제",
            onConfirm: () =>
              relateAwaited.mutate({
                listKey: BLOCKS_KEY,
                call: () => api.blocks.remove(memberId),
                successMessage: UNBLOCKED_MESSAGE,
              }),
          });
        } else {
          confirm({
            message: BLOCK_DESCRIPTION,
            confirmLabel: "차단",
            destructive: true,
            onConfirm: () =>
              relateAwaited.mutate({
                listKey: BLOCKS_KEY,
                call: () => api.blocks.add(memberId),
                successMessage: BLOCKED_MESSAGE,
              }),
          });
        }
      }
    },
    [confirm, loadSecretPhotos, member, memberId, relateAwaited, run, show],
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
          relateAwaited.mutate({
            listKey: SECRET_PHOTOS_KEY,
            call: () =>
              member.secretPhotoGrantedByMe
                ? api.secretPhotos.remove(memberId)
                : api.secretPhotos.add(memberId),
            successMessage: member.secretPhotoGrantedByMe
              ? SECRET_PHOTO_CLOSED_MESSAGE
              : SECRET_PHOTO_OPENED_MESSAGE,
          });
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
    <YStack flex={1}>
      <Stack.Screen options={screenOptions} />

      {member ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: tabBarOverlayHeight(insets.bottom),
            }}
          >
            <YStack>
              {photoGridOpen ? (
                <YStack px="$4">
                  <PhotoGrid
                    photos={member.publicPhotoUrls}
                    showPlaceholders
                    onPressPhoto={setGridPhotoIndex}
                  />
                </YStack>
              ) : (
                <PhotoPager photos={member.publicPhotoUrls} />
              )}

            </YStack>

            <YStack gap="$4" p="$4">
              <YStack gap="$1">
                <XStack items="center" justify="space-between" gap="$2">
                  <Text
                    flex={1}
                    numberOfLines={1}
                    fontSize="$6"
                    fontWeight="700"
                    onLongPress={() => copyMemberId(member.memberId)}
                  >
                    {member.nickname}
                  </Text>

                  {member.locatedAt && (
                    <Text
                      shrink={0}
                      theme="gray"
                      color="$color11"
                      fontSize="$2"
                    >
                      {formatRelativeTime(member.locatedAt, now)}
                    </Text>
                  )}
                </XStack>

                <XStack items="center" justify="space-between" gap="$2">
                  <XStack flex={1} items="center">
                    <Text theme="gray" color="$color11" fontSize="$4">
                      {`${genderLabel(member.gender)} · ${member.age}살 · `}
                    </Text>

                    <XStack items="center" gap="$1">
                      <HeartIcon
                        size={LIKE_ICON_SIZE}
                        weight="fill"
                        color={theme.gray10.val}
                      />

                      <Text theme="gray" color="$color11" fontSize="$4">
                        {member.receivedLikeCount}
                      </Text>
                    </XStack>
                  </XStack>

                  {member.distance !== undefined &&
                    member.distance !== null && (
                      <Text
                        shrink={0}
                        theme="gray"
                        color="$color11"
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

          <YStack
            position="absolute"
            r={SCROLL_TO_TOP_BOTTOM_GAP}
            b={tabBarOverlayHeight(insets.bottom) + SCROLL_TO_TOP_BOTTOM_GAP}
          >
            <RetroFloatingButton onPress={togglePhotoGrid}>
              <SquaresFourIcon
                size={GRID_ICON_SIZE}
                weight={photoGridOpen ? "fill" : "regular"}
                color="white"
              />
            </RetroFloatingButton>
          </YStack>
        </>
      ) : (
        <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
          {error ? (
            <>
              <Text color="$gray10" fontSize="$4" text="center">
                {isApiError(error) ? error.message : ERROR_MESSAGE}
              </Text>

              <RetroButton onPress={() => refetch()}>다시 시도</RetroButton>
            </>
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

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
        photos={member?.publicPhotoUrls ?? []}
        initialIndex={gridPhotoIndex ?? 0}
        open={gridPhotoIndex !== null}
        onClose={() => setGridPhotoIndex(null)}
      />

      <PhotoViewer
        photos={loadSecretPhotos.data ?? []}
        initialIndex={0}
        open={secretPhotoOpen}
        secret
        onClose={() => setSecretPhotoOpen(false)}
      />

      <MenuSheet open={menuOpen} onOpenChange={setMenuOpen} items={menuItems} />

      {alertElement}
    </YStack>
  );
}
