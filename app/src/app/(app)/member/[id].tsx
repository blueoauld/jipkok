import { router, Stack, useLocalSearchParams } from "expo-router";
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
import { AlertDialog, Button, Text, useTheme, XStack, YStack } from "tamagui";

import { HeaderCircleIconButton } from "@/components/HeaderCircleIconButton";
import { MenuSheet, type MenuSheetItem } from "@/components/MenuSheet";
import { PhotoPager } from "@/components/PhotoPager";
import { ProfileSection } from "@/components/ProfileSection";
import { TextInputDialog } from "@/components/TextInputDialog";

const ACTION_ICON_SIZE = 30;
const ACTION_BAR_HEIGHT = ACTION_ICON_SIZE + 10 + 15 + 6;

const NOTE_MAX_LENGTH = 100;

type ActionKey = "like" | "favorite" | "note" | "secretPhoto" | "block";

const ACTIONS: { key: ActionKey; icon: Icon }[] = [
  { key: "like", icon: HeartIcon },
  { key: "favorite", icon: StarIcon },
  { key: "note", icon: ChatCircleIcon },
  { key: "secretPhoto", icon: ImageIcon },
  { key: "block", icon: ProhibitIcon },
];

function ActionBar({ onPress }: { onPress: (key: ActionKey) => void }) {
  const theme = useTheme();

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
          pressStyle={{ opacity: 0.6 }}
          onPress={() => onPress(key)}
        >
          <Icon size={ACTION_ICON_SIZE} color={theme.color10.val} />
        </XStack>
      ))}
    </XStack>
  );
}

function buildMenuItems(id: string): MenuSheetItem[] {
  return [
    { label: "비밀 사진 공개" },
    {
      label: "신고하기",
      destructive: true,
      onPress: () => router.push(`/report/${id}?type=member`),
    },
  ];
}

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const handleAction = (key: ActionKey) => {
    // TODO: 좋아요·즐겨찾기·비밀사진 동작 연결
    if (key === "note") {
      setNoteOpen(true);
    }

    if (key === "block") {
      setBlockOpen(true);
    }
  };
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

  const profile = {
    nickname: `닉네임 ${id}`,
    gender: "남자",
    age: 20,
    likeCount: 100,
    updatedAt: "3일 전",
    distance: "0.2km",
    comment: "코멘트 내용",
    bio: "자기소개 내용",
    photos: [0, 1, 2, 3].map(
      (seed) => `https://picsum.photos/seed/${id}-${seed}/800/1000`,
    ),
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <PhotoPager photos={profile.photos} />

        <YStack gap="$4" p="$4">
          <YStack gap="$1">
            <XStack items="center" justify="space-between" gap="$2">
              <Text flex={1} numberOfLines={1} fontSize="$6" fontWeight="700">
                {profile.nickname}
              </Text>
              <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
                {profile.updatedAt}
              </Text>
            </XStack>

            <XStack items="center" justify="space-between" gap="$2">
              <Text
                flex={1}
                numberOfLines={1}
                theme="gray"
                color="$color10"
                fontSize="$4"
              >
                {`${profile.gender} · ${profile.age}살 · ♥ ${profile.likeCount}`}
              </Text>
              <Text shrink={0} theme="gray" color="$color10" fontSize="$2">
                {profile.distance}
              </Text>
            </XStack>
          </YStack>

          <ProfileSection title="코멘트" body={profile.comment} />
          <ProfileSection title="자기소개" body={profile.bio} />
        </YStack>
      </ScrollView>

      <ActionBar onPress={handleAction} />

      <AlertDialog modal open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay opacity={0.6} />

          <AlertDialog.Content width="85%" maxW={400} p="$4" gap="$3">
            <AlertDialog.Title fontSize="$6">차단</AlertDialog.Title>

            <AlertDialog.Description theme="gray" color="$color11">
              차단하면 상대방의 목록에 내가 표시되지 않고, 주고받은 대화 내역도
              모두 사라집니다.
            </AlertDialog.Description>

            <XStack gap="$2" mt="$2">
              <AlertDialog.Cancel asChild>
                <Button flex={1} size="$4" rounded="$7">
                  닫기
                </Button>
              </AlertDialog.Cancel>

              <AlertDialog.Action asChild>
                <Button flex={1} size="$4" theme="red" rounded="$7">
                  확인
                </Button>
              </AlertDialog.Action>
            </XStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      <TextInputDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title="쪽지"
        placeholder="내용 입력"
        maxLength={NOTE_MAX_LENGTH}
        submitLabel="전송"
        onSubmit={() => {}}
      />

      <MenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        items={buildMenuItems(id)}
      />
    </SafeAreaView>
  );
}
