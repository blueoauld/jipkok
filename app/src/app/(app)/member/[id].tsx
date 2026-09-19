import { Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { useTheme, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MemberActionBar } from "@/components/MemberActionBar";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ProfileBody } from "@/components/ProfileBody";
import { ProfileHeader } from "@/components/ProfileHeader";
import { PhotoGridToggle, ProfilePhotos } from "@/components/ProfilePhotos";
import { TextInputDialog } from "@/components/TextInputDialog";
import { CircleButton } from "@/components/ui/CircleButton";
import { ScreenState } from "@/components/ui/ScreenState";
import { useAlert } from "@/hooks/useAlert";
import { useBottomBarHeight } from "@/hooks/useBottomBar";
import { useMemberActions } from "@/hooks/useMemberActions";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { copyText } from "@/lib/clipboard";
import { SCREEN_PADDING } from "@/lib/design";
import { profileErrorMessage } from "@/lib/message";
import { useNoteStore } from "@/lib/note/store";
import { pushOnce } from "@/lib/router";

const NOTE_MAX_LENGTH = 100;
const MEMO_MAX_LENGTH = 100;

const MEMO_ICON_SIZE = 22;
const FLOATING_BUTTON_GAP = 12;

export default function MemberProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const barHeight = useBottomBarHeight();

  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [secretPhotoOpen, setSecretPhotoOpen] = useState(false);

  const { alertElement, show, showApiError, confirm } = useAlert();
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
        <HeaderIconButton
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
            <ProfilePhotos photos={member.publicPhotoUrls} />

            <ProfileHeader
              nickname={member.nickname}
              gender={member.gender}
              age={member.age}
              receivedLikeCount={member.receivedLikeCount}
              locatedAt={member.locatedAt}
              distance={member.distance}
              memo={member.memo}
              onLongPressNickname={() => copyMemberId(member.memberId)}
            />

            <ProfileBody comment={member.comment} bio={member.bio} />
          </ScrollView>

          <MemberActionBar
            member={member}
            pending={loadSecretPhotos.isPending ? "secretPhoto" : null}
            onPress={handleAction}
          />

          <YStack
            position="absolute"
            r={SCREEN_PADDING}
            b={barHeight + SCREEN_PADDING}
            gap={FLOATING_BUTTON_GAP}
          >
            <PhotoGridToggle />

            <CircleButton
              tone="translucentBlue"
              label={t("memberDetail.memoTitle")}
              onPress={() => setMemoOpen(true)}
            >
              <NotePencilIcon size={MEMO_ICON_SIZE} color={theme.onFill.val} />
            </CircleButton>
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
