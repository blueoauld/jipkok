import { router, Tabs } from "expo-router";
import {
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
} from "phosphor-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList } from "react-native";
import { Button, Dialog, getTokens, Text, XStack, YStack } from "tamagui";

import { FormInput } from "@/components/FormInput";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { SegmentedControl } from "@/components/SegmentedControl";
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

function CommentForm({
  defaultValue,
  onSubmit,
}: {
  defaultValue: string;
  onSubmit: (value: string) => void;
}) {
  const valueRef = useRef(defaultValue);
  const [length, setLength] = useState(defaultValue.length);

  return (
    <>
      <Dialog.Title fontSize="$6">코멘트</Dialog.Title>

      <YStack gap="$2">
        <FormInput
          defaultValue={defaultValue}
          onChangeText={(text) => {
            valueRef.current = text;
            setLength(text.length);
          }}
          placeholder={`최대 ${COMMENT_MAX_LENGTH}자`}
          maxLength={COMMENT_MAX_LENGTH}
          autoFocusNative
        />
        <Text self="flex-end" theme="gray" color="$color10">
          {`${length} / ${COMMENT_MAX_LENGTH}`}
        </Text>
      </YStack>

      <XStack gap="$2">
        <Dialog.Close asChild>
          <Button flex={1} size="$4" rounded="$7">
            닫기
          </Button>
        </Dialog.Close>

        <Dialog.Close asChild>
          <Button
            flex={1}
            size="$4"
            theme="blue"
            rounded="$7"
            onPress={() => onSubmit(valueRef.current)}
          >
            작성
          </Button>
        </Dialog.Close>
      </XStack>
    </>
  );
}

function CommentDialog({
  open,
  onOpenChange,
  defaultValue,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValue: string;
  onSubmit: (value: string) => void;
}) {
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay opacity={0.6} />

        <Dialog.Content width="85%" maxW={400} p="$4" gap="$4">
          <CommentForm
            key={String(open)}
            defaultValue={defaultValue}
            onSubmit={onSubmit}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

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

      <CommentDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
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
