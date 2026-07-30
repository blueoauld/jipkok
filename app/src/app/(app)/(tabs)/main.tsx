import { router, Tabs } from "expo-router";
import {
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
} from "phosphor-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { getTokens, XStack, YStack } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TextInputDialog } from "@/components/TextInputDialog";
import { UserRow, type User } from "@/components/UserRow";

const FILTERS = ["최근", "거리"] as const;
type Filter = (typeof FILTERS)[number];

const COMMENT_MAX_LENGTH = 100;

const GENDERS = ["전체", "남자", "여자"] as const;
type Gender = (typeof GENDERS)[number];

const USERS: User[] = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  nickname: `닉네임 ${index}`,
}));

export default function MainScreen() {
  const space = getTokens().space;
  const [filter, setFilter] = useState<Filter>("최근");
  const [gender, setGender] = useState<Gender>("전체");
  const [genderOpen, setGenderOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");

  const openGender = useCallback(() => setGenderOpen(true), []);
  const openComment = useCallback(() => setCommentOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      headerLeft: () => (
        <HeaderIconButton
          icon={MagnifyingGlassIcon}
          onPress={() => router.push("/member/search")}
        />
      ),
      headerRight: () => (
        <XStack>
          <HeaderIconButton icon={FunnelSimpleIcon} onPress={openGender} />
          <HeaderIconButton icon={NotePencilIcon} onPress={openComment} />
        </XStack>
      ),
    }),
    [openGender, openComment],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$2">
        <SegmentedControl
          values={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </YStack>

      <FlatList
        data={USERS}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => <UserRow user={item} />}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingTop: space.$3.val,
          paddingBottom: space.$4.val,
          paddingHorizontal: space.$4.val,
          gap: space.$4.val,
        }}
      />

      <TextInputDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        title="코멘트"
        placeholder="내용 입력"
        maxLength={COMMENT_MAX_LENGTH}
        defaultValue={comment}
        onSubmit={setComment}
      />

      <MenuSheet
        open={genderOpen}
        onOpenChange={setGenderOpen}
        items={GENDERS.map((label) => ({
          label,
          selected: label === gender,
          onPress: () => setGender(label),
        }))}
      />
    </YStack>
  );
}
