import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassView } from "expo-glass-effect";
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
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MemberMeta } from "@/components/MemberMeta";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoPager } from "@/components/photo/PhotoPager";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ProfileSection } from "@/components/ProfileSection";
import {
  SCROLL_TO_TOP_BOTTOM_GAP,
  SCROLL_TO_TOP_SIDE_GAP,
} from "@/components/ScrollToTopButton";
import { TextInputDialog } from "@/components/TextInputDialog";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroFloatingButton } from "@/components/ui/RetroFloatingButton";
import { ScreenState } from "@/components/ui/ScreenState";
import { useBottomBarHeight } from "@/hooks/useBottomBar";
import { CHAT_ROOMS_KEY } from "@/hooks/useChatRooms";
import { CHAT_UNREAD_COUNT_KEY } from "@/hooks/useChatUnreadCount";
import { FEEDS_KEY } from "@/hooks/useFeedPosts";
import { memberDetailKey, useMemberDetail } from "@/hooks/useMemberDetail";
import { relationKey } from "@/hooks/useMemberList";
import { POINT_BALANCE_KEY, POINT_HISTORIES_KEY } from "@/hooks/usePoints";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useSecretPhotos } from "@/hooks/useSecretPhotos";
import { APP_EVENT, type AppEventName, logAppEvent } from "@/lib/analytics";
import { api, type MemberDetailResponse } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { FAVORITE_COLOR } from "@/lib/color";
import {
  bottomBarHeight,
  FLOATING_BAR_RADIUS,
  floatingBarStyle,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import { GLASS_ENABLED, useGlassColorScheme } from "@/lib/glass";
import { formatDistance } from "@/lib/member";
import {
  bioCopiedMessage,
  commentCopiedMessage,
  profileBioEmptyMessage,
  profileCommentEmptyMessage,
  profileErrorMessage,
} from "@/lib/message";
import { useNoteStore } from "@/lib/note/store";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { usePhotoGridStore } from "@/lib/photo/grid-store";
import { pushOnce } from "@/lib/router";
import { useAccentColor } from "@/lib/theme/accent";

const ACTION_ICON_SIZE = 30;

const NOTE_MAX_LENGTH = 100;

const BADGE_SIZE = 18;
const BADGE_FONT_SIZE = 11;
const BADGE_OPACITY = 0.9;

const GRID_ICON_SIZE = 20;

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

type Relation = {
  listKeys: string[][];
  call: () => Promise<void>;
  event?: AppEventName;
};

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
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scheme = useGlassColorScheme();

  const filled: Record<ActionKey, boolean> = {
    like: member.likedByMe,
    favorite: member.favoritedByMe,
    note: member.noteReceiveEnabled,
    secretPhoto: member.secretPhotoGrantedToMe,
    block: member.blockedByMe,
  };
  const accent = useAccentColor();

  const colors: Record<ActionKey, string> = {
    like: theme.red10.val,
    favorite: FAVORITE_COLOR,
    note: accent,
    secretPhoto: theme.green10.val,
    block: theme.red10.val,
  };

  const disabled: Record<ActionKey, boolean> = {
    like: false,
    favorite: false,
    note: !member.noteReceiveEnabled || member.blockedByMe,
    secretPhoto: false,
    block: false,
  };

  const items = ACTIONS.map(({ key, icon: Icon }) => (
    <XStack
      key={key}
      flex={1}
      height="100%"
      items="center"
      justify="center"
      opacity={pending === key || disabled[key] ? 0.4 : 1}
      accessibilityRole="button"
      accessibilityLabel={t(`a11y.${key}`)}
      accessibilityState={{ selected: filled[key], disabled: disabled[key] }}
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
  ));

  if (GLASS_ENABLED) {
    return (
      <GlassView
        style={{
          ...floatingBarStyle(insets.bottom),
          borderRadius: FLOATING_BAR_RADIUS,
          flexDirection: "row",
        }}
        colorScheme={scheme}
      >
        {items}
      </GlassView>
    );
  }

  return (
    <XStack
      position="absolute"
      b={0}
      l={0}
      r={0}
      height={bottomBarHeight(insets.bottom)}
      pb={insets.bottom}
      bg="$color1"
      borderTopWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
    >
      {items}
    </XStack>
  );
}

export default function MemberProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const barHeight = useBottomBarHeight();
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
  const loadSecretPhotos = useSecretPhotos(memberId, showApiError);
  const queryKey = memberDetailKey(memberId);

  const sendNote = useMutation({
    mutationFn: (content: string) => api.members.sendNote(memberId, content),
    onSuccess: () => {
      logAppEvent(APP_EVENT.chatStarted);
      queryClient.invalidateQueries({ queryKey: POINT_BALANCE_KEY });
      queryClient.invalidateQueries({ queryKey: POINT_HISTORIES_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      show("info", t("memberDetail.noteSent"));
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
      show("info", successMessage);
    },
    onError: showApiError,
  });

  useLoadingOverlay(relateAwaited.isPending || sendNote.isPending);

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

  const copyMemberId = (id: number) =>
    copyText(String(id), t("memberDetail.idCopied"));

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
                ? show("info", t("memberDetail.secretPhotoEmpty"))
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
    [confirm, loadSecretPhotos, member, memberId, relateAwaited, run, show, t],
  );

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const screenOptions = useMemo(
    () => ({
      title: t("memberDetail.title"),
      headerRight: () => (
        <HeaderSoloIconButton
          icon={DotsThreeIcon}
          label={t("a11y.more")}
          weight="bold"
          onPress={openMenu}
        />
      ),
    }),
    [openMenu, t],
  );

  const menuItems: MenuSheetItem[] = [
    {
      label: member?.secretPhotoGrantedByMe
        ? t("memberDetail.closeSecretPhoto")
        : t("memberDetail.openSecretPhoto"),
      onPress: () => {
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
      },
    },
    {
      label: t("action.reportSubmit"),
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
              paddingBottom: barHeight,
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

                  {member.locatedAt && <RelativeTime at={member.locatedAt} />}
                </XStack>

                <XStack items="center" justify="space-between" gap="$2">
                  <XStack flex={1}>
                    <MemberMeta
                      gender={member.gender}
                      age={member.age}
                      receivedLikeCount={member.receivedLikeCount}
                      size="md"
                    />
                  </XStack>

                  {member.distance !== undefined &&
                    member.distance !== null && (
                      <Text shrink={0} fontSize="$2">
                        {formatDistance(member.distance)}
                      </Text>
                    )}
                </XStack>
              </YStack>

              <ProfileSection
                title={t("profile.comment")}
                body={member.comment}
                placeholder={profileCommentEmptyMessage()}
                copiedMessage={commentCopiedMessage()}
              />

              <ProfileSection
                title={t("profile.bio")}
                body={member.bio}
                placeholder={profileBioEmptyMessage()}
                copiedMessage={bioCopiedMessage()}
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
            r={SCROLL_TO_TOP_SIDE_GAP}
            b={barHeight + SCROLL_TO_TOP_BOTTOM_GAP}
          >
            <RetroFloatingButton
              label={t("a11y.photoGrid")}
              onPress={togglePhotoGrid}
            >
              <SquaresFourIcon
                size={GRID_ICON_SIZE}
                weight={photoGridOpen ? "fill" : "regular"}
                color="white"
              />
            </RetroFloatingButton>
          </YStack>
        </>
      ) : (
        <ScreenState
          error={error}
          message={profileErrorMessage()}
          onRetry={() => refetch()}
        />
      )}

      <TextInputDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title={t("memberDetail.noteTitle")}
        placeholder={t("common.contentPlaceholder")}
        maxLength={NOTE_MAX_LENGTH}
        defaultValue={noteContent}
        submitLabel={t("memberDetail.noteSubmit")}
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
