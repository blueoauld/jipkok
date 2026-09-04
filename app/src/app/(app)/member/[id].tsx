import { Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MemberActionBar } from "@/components/MemberActionBar";
import { MemberMeta } from "@/components/MemberMeta";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { PhotoGridToggle, ProfilePhotos } from "@/components/ProfilePhotos";
import { ProfileSection } from "@/components/ProfileSection";
import { TextInputDialog } from "@/components/TextInputDialog";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { RetroCard } from "@/components/ui/RetroCard";
import { ScreenState } from "@/components/ui/ScreenState";
import { useBottomBarHeight } from "@/hooks/useBottomBar";
import { useMemberActions } from "@/hooks/useMemberActions";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { copyText } from "@/lib/clipboard";
import { SCROLL_TO_TOP_BOTTOM_GAP } from "@/lib/design";
import { formatDistance } from "@/lib/member";
import {
  bioCopiedMessage,
  commentCopiedMessage,
  profileBioEmptyMessage,
  profileCommentEmptyMessage,
  profileErrorMessage,
} from "@/lib/message";
import { useNoteStore } from "@/lib/note/store";
import { usePhotoGridStore } from "@/lib/photo/grid-store";
import { pushOnce } from "@/lib/router";

const NOTE_MAX_LENGTH = 100;
const MEMO_MAX_LENGTH = 100;

export default function MemberProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const barHeight = useBottomBarHeight();

  const [menuOpen, setMenuOpen] = useState(false);
  const [gridPhotoIndex, setGridPhotoIndex] = useState<number | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [secretPhotoOpen, setSecretPhotoOpen] = useState(false);

  const { alertElement, show, showApiError, confirm } = useRetroAlert();
  const photoGridOpen = usePhotoGridStore((state) => state.open);
  const togglePhotoGrid = usePhotoGridStore((state) => state.toggle);
  const noteContent = useNoteStore((state) => state.content);
  const setNoteContent = useNoteStore((state) => state.setContent);

  const { data: member, error, refetch } = useMemberDetail(memberId);
  const openNote = useCallback(() => setNoteOpen(true), []);
  const openSecretPhotos = useCallback(() => setSecretPhotoOpen(true), []);
  const {
    handleAction,
    toggleSecretPhotoGrant,
    loadSecretPhotos,
    sendNote,
    updateMemo,
  } = useMemberActions(
    memberId,
    member,
    { show, showApiError, confirm },
    { openNote, openSecretPhotos },
  );

  const copyMemberId = (id: number) =>
    copyText(String(id), t("memberDetail.idCopied"));

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
      onPress: toggleSecretPhotoGrant,
    },
    {
      label: t("action.reportSubmit"),
      destructive: true,
      onPress: () =>
        pushOnce({
          pathname: "/report/[id]",
          params: member ? { id, nickname: member.nickname } : { id },
        }),
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
              <ProfilePhotos
                photos={member.publicPhotoUrls}
                gridOpen={photoGridOpen}
                onPressPhoto={setGridPhotoIndex}
              />
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

                  {member.distance != null && (
                    <Text
                      theme="gray"
                      shrink={0}
                      fontSize="$2"
                      color="$color11"
                    >
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

              <YStack gap="$2">
                <Text
                  theme="gray"
                  color="$color11"
                  fontSize="$3"
                  fontWeight="600"
                >
                  {t("memberDetail.memoTitle")}
                </Text>
                <RetroCard onPress={() => setMemoOpen(true)}>
                  <Text
                    fontSize="$4"
                    color={member.memo ? undefined : "$color11"}
                  >
                    {member.memo || t("memberDetail.memoPlaceholder")}
                  </Text>
                </RetroCard>
              </YStack>
            </YStack>
          </ScrollView>

          <MemberActionBar
            member={member}
            pending={loadSecretPhotos.isPending ? "secretPhoto" : null}
            onPress={handleAction}
          />

          <PhotoGridToggle
            open={photoGridOpen}
            bottom={barHeight + SCROLL_TO_TOP_BOTTOM_GAP}
            onPress={togglePhotoGrid}
          />
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
          sendNote(content);
        }}
      />

      <TextInputDialog
        open={memoOpen}
        onOpenChange={setMemoOpen}
        title={t("memberDetail.memoTitle")}
        placeholder={t("common.contentPlaceholder")}
        maxLength={MEMO_MAX_LENGTH}
        defaultValue={member?.memo ?? ""}
        clearable
        onSubmit={updateMemo}
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
