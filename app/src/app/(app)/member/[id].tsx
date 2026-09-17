import { Stack, useLocalSearchParams } from "expo-router";
import { DotsThreeIcon } from "phosphor-react-native/src/icons/DotsThree";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { Text, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { MemberActionBar } from "@/components/MemberActionBar";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { ProfileHeader } from "@/components/ProfileHeader";
import { PhotoGridToggle, ProfilePhotos } from "@/components/ProfilePhotos";
import { ProfileSection } from "@/components/ProfileSection";
import { TextInputDialog } from "@/components/TextInputDialog";
import { Border } from "@/components/ui/Border";
import { ListHeader } from "@/components/ui/ListHeader";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenState } from "@/components/ui/ScreenState";
import { useAlert } from "@/hooks/useAlert";
import { useBottomBarHeight } from "@/hooks/useBottomBar";
import { useMemberActions } from "@/hooks/useMemberActions";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { copyText } from "@/lib/clipboard";
import { LIST_ROW_VERTICAL_PADDING, SCREEN_PADDING } from "@/lib/design";
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

// 메모 행 안쪽 여백 8과 합쳐, 글 아래가 다른 묶음의 글 아래 여백(24)과 비슷해지게 한다.
const MEMO_PADDING_BOTTOM = 16;

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

  const { alertElement, show, showApiError, confirm } = useAlert();
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
            <ProfilePhotos
              photos={member.publicPhotoUrls}
              gridOpen={photoGridOpen}
              onPressPhoto={setGridPhotoIndex}
            />

            <ProfileHeader
              nickname={member.nickname}
              gender={member.gender}
              age={member.age}
              receivedLikeCount={member.receivedLikeCount}
              locatedAt={member.locatedAt}
              distance={member.distance}
              onLongPressNickname={() => copyMemberId(member.memberId)}
            />

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

            <YStack pb={MEMO_PADDING_BOTTOM}>
              <Border variant="height16" />
              <ListHeader pb={0}>{t("memberDetail.memoTitle")}</ListHeader>
              <ListRow
                horizontalPadding="small"
                verticalPadding={LIST_ROW_VERTICAL_PADDING.small}
                withArrow
                onPress={() => setMemoOpen(true)}
              >
                <Text
                  fontSize="$4"
                  lineHeight="$4"
                  color={member.memo ? "$grey700" : "$grey500"}
                >
                  {member.memo || t("memberDetail.memoPlaceholder")}
                </Text>
              </ListRow>
            </YStack>
          </ScrollView>

          <MemberActionBar
            member={member}
            pending={loadSecretPhotos.isPending ? "secretPhoto" : null}
            onPress={handleAction}
          />

          <PhotoGridToggle
            open={photoGridOpen}
            bottom={barHeight + SCREEN_PADDING}
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
