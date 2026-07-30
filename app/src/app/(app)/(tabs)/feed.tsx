import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import { router, Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import {
  BellIcon,
  CameraIcon,
  HeartIcon,
  ImagesIcon,
  NotePencilIcon,
  SirenIcon,
  XIcon,
} from "phosphor-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, type ViewStyle } from "react-native";

import {
  Avatar,
  Button,
  Dialog,
  getTokens,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { SegmentedControl } from "@/components/SegmentedControl";
import { pickSinglePhoto, takePhoto } from "@/hooks/usePhotos";

const CARD_RATIO = 2;

const GRADIENT_HEIGHT = "35%";
const TOP_GRADIENT: ViewStyle = {
  experimental_backgroundImage:
    "linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent)",
};
const BOTTOM_GRADIENT: ViewStyle = {
  experimental_backgroundImage:
    "linear-gradient(to top, rgba(0, 0, 0, 0.35), transparent)",
};

const CAPTION_MAX_LENGTH = 50;

const FILTERS = ["전체", "남자", "여자"] as const;
type Filter = (typeof FILTERS)[number];

type Post = {
  id: string;
  authorId: string;
  nickname: string;
  time: string;
  caption?: string;
  photo: string;
  avatar: string;
};

const POSTS: Post[] = [
  { id: "0", time: "15:00" },
  { id: "1", time: "14:00", caption: "미팅" },
  { id: "2", time: "13:00", caption: "회의에서 얻은 커피" },
  { id: "3", time: "12:00", caption: "인생 한방 노리기" },
  { id: "4", time: "11:00", caption: "인터뷰하러 강남" },
].map((post) => ({
  ...post,
  authorId: post.id,
  nickname: `닉네임 ${post.id}`,
  photo: `https://picsum.photos/seed/feed-${post.id}/1000/400`,
  avatar: `https://picsum.photos/seed/user-${post.id}/100`,
}));

function FeedCard({ post, onReport }: { post: Post; onReport: () => void }) {
  return (
    <YStack
      width="100%"
      aspectRatio={CARD_RATIO}
      rounded="$7"
      overflow="hidden"
    >
      <Image source={post.photo} contentFit="cover" style={{ flex: 1 }} />

      <YStack
        position="absolute"
        t={0}
        l={0}
        r={0}
        height={GRADIENT_HEIGHT}
        pointerEvents="none"
        style={TOP_GRADIENT}
      />

      <YStack
        position="absolute"
        b={0}
        l={0}
        r={0}
        height={GRADIENT_HEIGHT}
        pointerEvents="none"
        style={BOTTOM_GRADIENT}
      />

      <XStack
        position="absolute"
        t="$3"
        l="$3"
        items="center"
        gap="$2"
        pressStyle={{ opacity: 0.6 }}
        onPress={() => router.push(`/member/${post.authorId}`)}
      >
        <Avatar circular size="$3">
          <Avatar.Image src={post.avatar} />
          <Avatar.Fallback theme="gray" bg="$color5"></Avatar.Fallback>
        </Avatar>

        <Text
          numberOfLines={1}
          maxW="60%"
          color="white"
          fontSize="$3"
          fontWeight="600"
        >
          {post.nickname}
        </Text>
      </XStack>

      <XStack
        position="absolute"
        t="$2"
        r="$2"
        p="$2"
        pressStyle={{ opacity: 0.6 }}
        onPress={onReport}
      >
        <SirenIcon size={28} weight="bold" color="white" />
      </XStack>

      <XStack
        position="absolute"
        b="$2"
        r="$2"
        p="$2"
        pressStyle={{ opacity: 0.6 }}
      >
        <HeartIcon size={28} weight="bold" color="white" />
      </XStack>

      <YStack fullscreen items="center" justify="center" px="$4">
        <Text color="white" fontSize="$9" fontWeight="800">
          {post.time}
        </Text>

        {post.caption && (
          <Text numberOfLines={1} color="white" fontSize="$5" fontWeight="600">
            {post.caption}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}

function TodayButton() {
  const theme = useTheme();
  const hasGlass = isLiquidGlassAvailable();

  return (
    <GlassView
      glassEffectStyle="regular"
      style={{
        borderRadius: 9999,
        overflow: "hidden",
        backgroundColor: hasGlass ? undefined : theme.gray4.val,
      }}
    >
      <XStack px="$4" py="$2" pressStyle={{ opacity: 0.7 }}>
        <Text fontSize="$4">오늘</Text>
      </XStack>
    </GlassView>
  );
}

function PickerTile({
  icon: Icon,
  onPress,
}: {
  icon: Icon;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      flex={1}
      aspectRatio={1}
      rounded="$7"
      bg="$gray4"
      items="center"
      justify="center"
      pressStyle={{ opacity: 0.6 }}
      onPress={onPress}
    >
      <Icon size={36} color={theme.gray9.val} />
    </YStack>
  );
}

function ComposeForm({
  onSubmit,
}: {
  onSubmit: (photo: string, caption: string) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const captionRef = useRef("");
  const [length, setLength] = useState(0);

  const choose = async (pick: () => Promise<string | null>) => {
    const picked = await pick();

    if (picked) {
      setPhoto(picked);
    }
  };

  return (
    <>
      <Dialog.Title fontSize="$6">피드</Dialog.Title>

      {photo ? (
        <YStack aspectRatio={CARD_RATIO} rounded="$7" overflow="hidden">
          <Image source={photo} contentFit="cover" style={{ flex: 1 }} />

          <XStack
            position="absolute"
            t="$3"
            r="$3"
            width={24}
            height={24}
            rounded={9999}
            bg="$red10"
            items="center"
            justify="center"
            pressStyle={{ opacity: 0.6 }}
            onPress={() => setPhoto(null)}
          >
            <XIcon size={14} weight="bold" color="white" />
          </XStack>
        </YStack>
      ) : (
        <XStack gap="$2">
          <PickerTile
            icon={ImagesIcon}
            onPress={() => choose(pickSinglePhoto)}
          />
          <PickerTile icon={CameraIcon} onPress={() => choose(takePhoto)} />
        </XStack>
      )}

      <FormField
        right={
          <Text theme="gray" color="$color10">
            {`${length} / ${CAPTION_MAX_LENGTH}`}
          </Text>
        }
      >
        <FormInput
          onChangeText={(text) => {
            captionRef.current = text;
            setLength(text.length);
          }}
          placeholder="내용 입력"
          maxLength={CAPTION_MAX_LENGTH}
          submitBehavior="submit"
          autoFocusNative
        />
      </FormField>

      <XStack gap="$2">
        <Dialog.Close asChild>
          <Button flex={1} size="$4" rounded="$7">
            닫기
          </Button>
        </Dialog.Close>

        <Button
          flex={1}
          size="$4"
          theme="blue"
          rounded="$7"
          disabled={!photo}
          onPress={() => photo && onSubmit(photo, captionRef.current)}
        >
          작성
        </Button>
      </XStack>
    </>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay opacity={0.6} />

        <Dialog.Content width="85%" maxW={400} p="$4" gap="$4" y={-120}>
          <ComposeForm
            key={String(open)}
            onSubmit={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

export default function FeedScreen() {
  const space = getTokens().space;
  const [filter, setFilter] = useState<Filter>("전체");
  const [reportId, setReportId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const openCompose = useCallback(() => setComposeOpen(true), []);

  const screenOptions = useMemo(
    () => ({
      headerLeft: () => <HeaderIconButton icon={BellIcon} />,
      headerRight: () => (
        <HeaderIconButton icon={NotePencilIcon} onPress={openCompose} />
      ),
    }),
    [openCompose],
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
        data={POSTS}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <FeedCard post={item} onReport={() => setReportId(item.id)} />
        )}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingTop: space.$3.val,
          paddingBottom: space.$4.val,
          paddingHorizontal: space.$4.val,
          gap: space.$2.val,
        }}
      />

      <XStack position="absolute" b="$4" l={0} r={0} justify="center">
        <TodayButton />
      </XStack>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />

      <ConfirmDialog
        open={reportId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReportId(null);
          }
        }}
        title="피드 신고"
        description="신고한 피드는 검토 후 조치됩니다."
        confirmLabel="신고"
        destructive
      />
    </YStack>
  );
}
