import DateTimePicker from "@react-native-community/datetimepicker";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
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
import { FlatList, RefreshControl, type ViewStyle } from "react-native";

import {
  Button,
  Dialog,
  getTokens,
  Spinner,
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
import { UserAvatar } from "@/components/UserAvatar";
import { feedPostsKey, useFeedPosts } from "@/hooks/useFeedPosts";
import { pickSinglePhoto, takePhoto } from "@/hooks/usePhotos";
import { alertApiError, alertInfo } from "@/lib/alert";
import {
  api,
  isApiError,
  type FeedPostPage,
  type FeedPostResponse,
  type Gender,
} from "@/lib/api";
import { formatDateLabel, formatSlotTime } from "@/lib/date";
import { useFeedFilterStore } from "@/lib/filter/store";
import { uploadFeedPhoto } from "@/lib/photo";
import { pushOnce } from "@/lib/router";
import type { ImagePickerAsset } from "expo-image-picker";

const CARD_RATIO = 2;

const AVATAR_SIZE = 36;

const PHOTO_TRANSITION = 200;

const GRADIENT_HEIGHT = "35%";
const TOP_GRADIENT: ViewStyle = {
  experimental_backgroundImage:
    "linear-gradient(to bottom, rgba(0, 0, 0, 0.35), transparent)",
};
const BOTTOM_GRADIENT: ViewStyle = {
  experimental_backgroundImage:
    "linear-gradient(to top, rgba(0, 0, 0, 0.35), transparent)",
};

const CAPTION_MAX_LENGTH = 30;

const FEEDS_KEY = ["feeds"];

const PICKER_LOCALE = "ko-KR";
const OVERLAY_OPACITY = 0.6;

const FILTERS = ["전체", "남자", "여자"] as const;
type Filter = (typeof FILTERS)[number];

const GENDER_VALUES: Record<Filter, Gender | null> = {
  전체: null,
  남자: "MALE",
  여자: "FEMALE",
};
const GENDER_LABELS: Record<string, Filter> = {
  MALE: "남자",
  FEMALE: "여자",
};

const ERROR_MESSAGE = "피드를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "피드가 없습니다.";
const POSTED_MESSAGE = "피드를 올렸습니다.";
const REPORTED_MESSAGE = "신고를 접수했습니다.";

function FeedCard({
  post,
  onReport,
  onToggleLike,
}: {
  post: FeedPostResponse;
  onReport: () => void;
  onToggleLike: () => void;
}) {
  return (
    <YStack
      width="100%"
      aspectRatio={CARD_RATIO}
      rounded="$7"
      overflow="hidden"
      bg="$gray4"
    >
      <Image
        source={post.imageUrl}
        recyclingKey={String(post.postId)}
        contentFit="cover"
        transition={PHOTO_TRANSITION}
        style={{ flex: 1 }}
      />

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
        onPress={() => pushOnce(`/member/${post.memberId}`)}
      >
        <UserAvatar
          id={String(post.memberId)}
          url={post.profileImageUrl}
          size={AVATAR_SIZE}
          circular
        />

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
        onPress={onToggleLike}
      >
        <HeartIcon
          size={28}
          weight={post.likedByMe ? "fill" : "bold"}
          color="white"
        />
      </XStack>

      <YStack fullscreen items="center" justify="center" px="$4">
        <Text color="white" fontSize="$9" fontWeight="800">
          {formatSlotTime(post.slotAt)}
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

function DateButton({ date, onPress }: { date: Date; onPress: () => void }) {
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
      <XStack px="$4" py="$2" pressStyle={{ opacity: 0.7 }} onPress={onPress}>
        <Text fontSize="$4">{formatDateLabel(date)}</Text>
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
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (photo: ImagePickerAsset, caption: string) => void;
}) {
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const captionRef = useRef("");
  const [length, setLength] = useState(0);

  const choose = async (pick: () => Promise<ImagePickerAsset | null>) => {
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
          <Image source={photo.uri} contentFit="cover" style={{ flex: 1 }} />

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
          disabled={!photo || pending}
          opacity={!photo || pending ? 0.6 : 1}
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
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (photo: ImagePickerAsset, caption: string) => void;
}) {
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay opacity={0.6} />

        <Dialog.Content width="85%" maxW={400} p="$4" gap="$4" y={-120}>
          <ComposeForm
            key={String(open)}
            pending={pending}
            onSubmit={onSubmit}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

export default function FeedScreen() {
  const space = getTokens().space;
  const queryClient = useQueryClient();
  const [reportId, setReportId] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const openCompose = useCallback(() => setComposeOpen(true), []);

  const gender = useFeedFilterStore((state) => state.gender);
  const setGender = useFeedFilterStore((state) => state.setGender);
  const feed = useFeedPosts(date, gender);
  const { posts, error, isFetchingNextPage, hasNextPage, fetchNextPage } = feed;

  const queryKey = feedPostsKey(date, gender);
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: FEEDS_KEY }),
    [queryClient],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await feed.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [feed]);

  const toggleLike = useMutation({
    mutationFn: (post: FeedPostResponse) =>
      post.likedByMe
        ? api.feeds.cancelLike(post.postId)
        : api.feeds.like(post.postId),
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<FeedPostPage>>(queryKey);

      queryClient.setQueryData<InfiniteData<FeedPostPage>>(
        queryKey,
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.postId === post.postId
                  ? { ...item, likedByMe: !item.likedByMe }
                  : item,
              ),
            })),
          },
      );

      return { previous };
    },
    onError: (mutationError, _post, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      alertApiError(mutationError);
    },
  });

  const report = useMutation({
    mutationFn: api.feeds.report,
    onSuccess: async () => {
      await invalidate();
      alertInfo(REPORTED_MESSAGE);
    },
    onError: alertApiError,
  });

  const compose = useMutation({
    mutationFn: async ({
      photo,
      caption,
    }: {
      photo: ImagePickerAsset;
      caption: string;
    }) => {
      const objectKey = await uploadFeedPhoto(photo);

      await api.feeds.create({ objectKey, caption: caption || null });
    },
    onSuccess: async () => {
      setComposeOpen(false);
      await invalidate();
      alertInfo(POSTED_MESSAGE);
    },
    onError: alertApiError,
  });

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
          value={GENDER_LABELS[gender ?? ""] ?? "전체"}
          onChange={(label) => setGender(GENDER_VALUES[label])}
        />
      </YStack>

      {posts ? (
        <FlatList
          data={posts}
          keyExtractor={(post) => String(post.postId)}
          renderItem={({ item }) => (
            <FeedCard
              post={item}
              onReport={() => setReportId(item.postId)}
              onToggleLike={() => toggleLike.mutate(item)}
            />
          )}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{
            paddingTop: space.$3.val,
            paddingBottom: space.$4.val,
            paddingHorizontal: space.$4.val,
            gap: space.$4.val,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <YStack items="center" py="$4">
                <Spinner size="small" />
              </YStack>
            ) : null
          }
          ListEmptyComponent={
            <YStack items="center" py="$8">
              <Text theme="gray" color="$color10" fontSize="$4">
                {EMPTY_MESSAGE}
              </Text>
            </YStack>
          }
        />
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
                onPress={() => feed.refetch()}
              >
                다시 시도
              </Button>
            </>
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

      <XStack position="absolute" b="$4" l={0} r={0} justify="center">
        <DateButton date={date} onPress={() => setPickerOpen(true)} />
      </XStack>

      {pickerOpen && (
        <>
          <YStack
            fullscreen
            bg="$background"
            opacity={OVERLAY_OPACITY}
            onPress={() => setPickerOpen(false)}
          />

          <YStack
            position="absolute"
            b={0}
            l={0}
            r={0}
            items="center"
            pt="$2"
            pb="$4"
            bg="$background"
          >
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              locale={PICKER_LOCALE}
              maximumDate={new Date()}
              onValueChange={(_event, selected) => {
                setPickerOpen(false);
                setDate(selected);
              }}
            />
          </YStack>
        </>
      )}

      <ComposeDialog
        open={composeOpen}
        pending={compose.isPending}
        onOpenChange={setComposeOpen}
        onSubmit={(photo, caption) => compose.mutate({ photo, caption })}
      />

      <ConfirmDialog
        open={reportId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReportId(null);
          }
        }}
        title="피드"
        description="신고한 피드는 검토 후 조치됩니다."
        confirmLabel="신고"
        destructive
        onConfirm={() => reportId !== null && report.mutate(reportId)}
      />
    </YStack>
  );
}
