import DateTimePicker from "@react-native-community/datetimepicker";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import type { ImagePickerAsset } from "expo-image-picker";
import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { NotePencilIcon } from "phosphor-react-native/src/icons/NotePencil";
import { SirenIcon } from "phosphor-react-native/src/icons/Siren";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Dialog,
  getTokens,
  Spinner,
  Text,
  useTheme,
  XStack,
  type XStackProps,
  YStack,
} from "tamagui";

import { BellToggleButton } from "@/components/BellToggleButton";
import { FormField } from "@/components/FormField";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { MenuSheet } from "@/components/MenuSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import {
  SCROLL_EVENT_THROTTLE,
  SCROLL_TO_TOP_BOTTOM_GAP,
  ScrollToTopButton,
  useScrollToTopVisible,
} from "@/components/ScrollToTopButton";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroSegmentedControl } from "@/components/ui/RetroSegmentedControl";
import { useDialogKeyboardOffset } from "@/hooks/useDialogKeyboardOffset";
import { feedPostsKey, useFeedPosts } from "@/hooks/useFeedPosts";
import { useMyProfile } from "@/hooks/useMyProfile";
import { pickSinglePhoto, takePhoto } from "@/hooks/usePhotos";
import { alertApiError, alertInfo, confirmAlert } from "@/lib/alert";
import {
  api,
  type FeedPostPage,
  type FeedPostResponse,
  type FeedSort,
  isApiError,
} from "@/lib/api";
import { formatDateLabel, formatSlotTime, fromDateParam } from "@/lib/date";
import {
  DISABLED_OPACITY,
  SHEET_OVERLAY_OPACITY,
  tabBarOverlayHeight,
} from "@/lib/design";
import { useFeedFilterStore } from "@/lib/filter/store";
import {
  GENDER_FILTER_VALUES,
  GENDER_FILTERS,
  genderLabel,
} from "@/lib/member";
import { uploadFeedPhoto } from "@/lib/photo";
import { pushOnce } from "@/lib/router";

const CARD_RATIO = 2;

const REPORT_BUTTON_SPACE = 56;

const PHOTO_TRANSITION = 200;

const CAPTION_MAX_LENGTH = 30;

const FEEDS_KEY = ["feeds"];

const PICKER_LOCALE = "ko-KR";

const SORTS = ["최신", "과거"] as const;
type Sort = (typeof SORTS)[number];

const SORT_VALUES: Record<Sort, FeedSort> = { 최신: "LATEST", 과거: "OLDEST" };
const SORT_LABELS: Record<FeedSort, Sort> = { LATEST: "최신", OLDEST: "과거" };

const SHADOW_OFFSET = 4;
const SMALL_SHADOW_OFFSET = 2;
const CARD_ICON_SIZE = 22;
const CARD_ICON_BUTTON_SIZE = 40;

const ERROR_MESSAGE = "피드를 불러오지 못했습니다.";
const EMPTY_MESSAGE = "피드가 없습니다.";
const POSTED_MESSAGE = "피드를 올렸습니다.";
const REPORTED_MESSAGE = "신고를 접수했습니다.";

const FEED_NOTIFICATION_ON_MESSAGE = "이제 피드 알림을 받을 수 있습니다.";
const FEED_NOTIFICATION_OFF_MESSAGE = "이제 피드 알림을 받지 않습니다.";

function CardButton({ children, ...props }: XStackProps) {
  return (
    <YStack>
      <YStack
        position="absolute"
        t={SMALL_SHADOW_OFFSET}
        b={-SMALL_SHADOW_OFFSET}
        l={SMALL_SHADOW_OFFSET}
        r={-SMALL_SHADOW_OFFSET}
        bg="$gray12"
      />
      <XStack
        borderWidth={2}
        borderColor="$gray12"
        bg="$color1"
        items="center"
        justify="center"
        pressStyle={{
          x: SMALL_SHADOW_OFFSET,
          y: SMALL_SHADOW_OFFSET,
          bg: "$color3",
        }}
        {...props}
      >
        {children}
      </XStack>
    </YStack>
  );
}

function FeedCard({
  post,
  mine,
  onPress,
  onReport,
  onToggleLike,
}: {
  post: FeedPostResponse;
  mine: boolean;
  onPress: () => void;
  onReport: () => void;
  onToggleLike: () => void;
}) {
  const theme = useTheme();

  return (
    <RetroCard
      p={0}
      width="100%"
      aspectRatio={CARD_RATIO}
      overflow="hidden"
      bg="$gray4"
      onPress={onPress}
    >
      <Image
        source={post.imageUrl}
        recyclingKey={String(post.postId)}
        contentFit="cover"
        transition={PHOTO_TRANSITION}
        style={{ flex: 1 }}
      />

      <XStack position="absolute" t="$3" l="$3" r={REPORT_BUTTON_SPACE}>
        <CardButton
          px="$3"
          py="$2"
          onPress={() =>
            pushOnce(mine ? "/member/me" : `/member/${post.memberId}`)
          }
        >
          <Text
            shrink={1}
            numberOfLines={1}
            color="$color12"
            fontSize="$3"
            fontWeight="600"
          >
            {post.nickname}
          </Text>
        </CardButton>
      </XStack>

      <YStack position="absolute" t="$3" r="$3">
        <CardButton
          width={CARD_ICON_BUTTON_SIZE}
          height={CARD_ICON_BUTTON_SIZE}
          onPress={onReport}
        >
          <SirenIcon
            size={CARD_ICON_SIZE}
            weight="bold"
            color={theme.color12.val}
          />
        </CardButton>
      </YStack>

      <YStack position="absolute" b="$3" r="$3">
        <CardButton
          width={CARD_ICON_BUTTON_SIZE}
          height={CARD_ICON_BUTTON_SIZE}
          onPress={onToggleLike}
        >
          <HeartIcon
            size={CARD_ICON_SIZE}
            weight={post.likedByMe ? "fill" : "bold"}
            color={post.likedByMe ? theme.red10.val : theme.color12.val}
          />
        </CardButton>
      </YStack>

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
    </RetroCard>
  );
}

function DateButton({ date, onPress }: { date: Date; onPress: () => void }) {
  return (
    <RetroCard shadow="$gray12" px="$4" py="$2" onPress={onPress}>
      <Text fontSize="$4">{formatDateLabel(date)}</Text>
    </RetroCard>
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
    <RetroCard
      flex={1}
      p={0}
      aspectRatio={1}
      bg="$gray4"
      items="center"
      justify="center"
      onPress={onPress}
    >
      <Icon size={36} color={theme.color12.val} />
    </RetroCard>
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
        <YStack
          aspectRatio={CARD_RATIO}
          rounded={0}
          borderWidth={2}
          borderColor="$color12"
          overflow="hidden"
        >
          <Image source={photo.uri} contentFit="cover" style={{ flex: 1 }} />

          <YStack position="absolute" t="$3" r="$3">
            <YStack
              position="absolute"
              t={SMALL_SHADOW_OFFSET}
              b={-SMALL_SHADOW_OFFSET}
              l={SMALL_SHADOW_OFFSET}
              r={-SMALL_SHADOW_OFFSET}
              bg="$gray12"
            />
            <XStack
              width={24}
              height={24}
              rounded={0}
              borderWidth={2}
              borderColor="$gray12"
              bg="$red10"
              items="center"
              justify="center"
              pressStyle={{ x: SMALL_SHADOW_OFFSET, y: SMALL_SHADOW_OFFSET }}
              onPress={() => setPhoto(null)}
            >
              <XIcon size={14} weight="bold" color="white" />
            </XStack>
          </YStack>
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
        <RetroInput
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

      <XStack gap="$3">
        <Dialog.Close asChild>
          <RetroButton
            flex={1}
            theme="gray"
            opacity={pending ? DISABLED_OPACITY : 1}
          >
            닫기
          </RetroButton>
        </Dialog.Close>

        <RetroButton
          flex={1}
          disabled={!photo || pending}
          opacity={!photo || pending ? DISABLED_OPACITY : 1}
          onPress={() => photo && onSubmit(photo, captionRef.current)}
        >
          {pending ? <Spinner size="small" color="white" /> : "작성"}
        </RetroButton>
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
  const keyboardOffset = useDialogKeyboardOffset();

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <Dialog.Portal>
        <Dialog.Overlay bg="black" opacity={SHEET_OVERLAY_OPACITY} />

        <Dialog.Content
          width="85%"
          maxW={400}
          p={0}
          bg="transparent"
          rounded={0}
          borderWidth={0}
          elevation={0}
          shadowOpacity={0}
          y={keyboardOffset}
        >
          <YStack>
            <YStack
              position="absolute"
              t={SHADOW_OFFSET}
              b={-SHADOW_OFFSET}
              l={SHADOW_OFFSET}
              r={-SHADOW_OFFSET}
              bg="$gray12"
            />
            <YStack
              borderWidth={2}
              borderColor="$color12"
              bg="$color1"
              p="$4"
              gap="$4"
            >
              <ComposeForm
                key={String(open)}
                pending={pending}
                onSubmit={onSubmit}
              />
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

function FeedNotificationButton() {
  const { data: profile } = useMyProfile();

  return (
    <BellToggleButton
      enabled={profile?.feedNotificationEnabled ?? true}
      field="feedNotificationEnabled"
      update={api.members.updateFeedNotification}
      onMessage={FEED_NOTIFICATION_ON_MESSAGE}
      offMessage={FEED_NOTIFICATION_OFF_MESSAGE}
    />
  );
}

export default function FeedScreen() {
  const space = getTokens().space;
  const insets = useSafeAreaInsets();
  const tabBarOverlay = tabBarOverlayHeight(insets.bottom);
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [composeOpen, setComposeOpen] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const listRef = useRef<FlatList<FeedPostResponse>>(null);
  const scrollTop = useScrollToTopVisible();
  const openCompose = useCallback(() => setComposeOpen(true), []);
  const openGender = useCallback(() => setGenderOpen(true), []);

  const sort = useFeedFilterStore((state) => state.sort);
  const setSort = useFeedFilterStore((state) => state.setSort);
  const gender = useFeedFilterStore((state) => state.gender);
  const setGender = useFeedFilterStore((state) => state.setGender);
  const storedDate = useFeedFilterStore((state) => state.date);
  const setDate = useFeedFilterStore((state) => state.setDate);
  const date = useMemo(() => fromDateParam(storedDate), [storedDate]);
  const feed = useFeedPosts(date, gender, sort);
  const { posts, error, isFetchingNextPage, hasNextPage, fetchNextPage } = feed;

  const queryKey = feedPostsKey(date, gender, sort);
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
      headerLeft: () => <FeedNotificationButton />,
      headerRight: () => (
        <XStack>
          <HeaderIconButton icon={FunnelSimpleIcon} onPress={openGender} />
          <HeaderIconButton icon={NotePencilIcon} onPress={openCompose} />
        </XStack>
      ),
    }),
    [openCompose, openGender],
  );

  return (
    <YStack flex={1}>
      <Tabs.Screen options={screenOptions} />

      <YStack px="$4" pt="$4" pb="$2">
        <RetroSegmentedControl
          values={SORTS}
          value={SORT_LABELS[sort]}
          onChange={(label) => setSort(SORT_VALUES[label])}
        />
      </YStack>

      {posts ? (
        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={(post) => String(post.postId)}
          renderItem={({ item }) => (
            <FeedCard
              post={item}
              mine={item.memberId === profile?.memberId}
              onPress={() => setViewerUrl(item.imageUrl)}
              onReport={() =>
                confirmAlert({
                  title: "피드",
                  message: "신고한 피드는 검토 후 조치됩니다.",
                  confirmLabel: "신고",
                  destructive: true,
                  onConfirm: () => report.mutate(item.postId),
                })
              }
              onToggleLike={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleLike.mutate(item);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
          onScroll={scrollTop.onScroll}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          contentContainerStyle={{
            paddingTop: space.$3.val,
            paddingBottom: space.$4.val + tabBarOverlay,
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

              <RetroButton onPress={() => feed.refetch()}>
                다시 시도
              </RetroButton>
            </>
          ) : (
            <Spinner size="small" />
          )}
        </YStack>
      )}

      <ScrollToTopButton
        visible={scrollTop.visible}
        onPress={() => listRef.current?.scrollToOffset({ offset: 0 })}
      />

      <XStack
        position="absolute"
        b={SCROLL_TO_TOP_BOTTOM_GAP + tabBarOverlay}
        l={0}
        r={0}
        justify="center"
      >
        <DateButton date={date} onPress={() => setPickerOpen(true)} />
      </XStack>

      {pickerOpen && (
        <>
          <YStack
            fullscreen
            bg="black"
            opacity={SHEET_OVERLAY_OPACITY}
            onPress={() => setPickerOpen(false)}
          />

          <YStack
            position="absolute"
            b={0}
            l={0}
            r={0}
            items="center"
            pt="$2"
            pb={space.$4.val + tabBarOverlay}
            bg="$background"
            borderTopWidth={2}
            borderColor="$color12"
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

      <PhotoViewer
        photos={viewerUrl ? [viewerUrl] : []}
        initialIndex={0}
        open={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
      />

      <MenuSheet
        open={genderOpen}
        onOpenChange={setGenderOpen}
        items={GENDER_FILTERS.map((label) => ({
          label,
          selected: label === (gender ? genderLabel(gender) : "전체"),
          onPress: () => setGender(GENDER_FILTER_VALUES[label]),
        }))}
      />
    </YStack>
  );
}
