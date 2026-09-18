import { Image } from "expo-image";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { getTokens, useTheme, YStack } from "tamagui";

import { DurationBadge } from "@/components/ui/DurationBadge";
import {
  PHOTO_OVERLAY_ICON_SIZE,
  PhotoOverlayButton,
} from "@/components/ui/PhotoOverlayButton";
import {
  type DiaryDraftAttachment,
  draftDurationSeconds,
  draftPreviewUri,
  isDraftVideo,
} from "@/hooks/useDiaryAttachments";
import { mediaSummary } from "@/lib/chat";
import {
  COVER_IMAGE_STYLE,
  DARK_FILL,
  IMAGE_TRANSITION,
  OVERLAY_INK,
  PHOTO_PRESS_OPACITY,
  PHOTO_TILE_RADIUS,
  SCREEN_PADDING,
} from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";
import { formatDuration } from "@/lib/video";

const TILE_SIZE = 96;
const ADD_ICON_SIZE = 22;
const PLAY_ICON_SIZE = 24;
const DURATION_INSET = 6;

function Tile({
  item,
  onPress,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  item: DiaryDraftAttachment;
  onPress: () => void;
  onRemove?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const uri = draftPreviewUri(item);
  const video = isDraftVideo(item);
  const durationSeconds = draftDurationSeconds(item);

  return (
    <YStack
      width={TILE_SIZE}
      height={TILE_SIZE}
      rounded={PHOTO_TILE_RADIUS}
      overflow="hidden"
      bg="$grey100"
      pressStyle={{ opacity: PHOTO_PRESS_OPACITY }}
      accessible={!onRemove && !onMoveLeft && !onMoveRight}
      accessibilityRole="imagebutton"
      accessibilityLabel={[
        mediaSummary(video ? "VIDEO" : "PHOTO"),
        durationSeconds != null && formatDuration(durationSeconds),
      ]
        .filter(Boolean)
        .join(" ")}
      onPress={onPress}
    >
      <Image
        source={{ uri, cacheKey: photoCacheKey(uri) }}
        contentFit="cover"
        transition={IMAGE_TRANSITION}
        style={COVER_IMAGE_STYLE}
      />

      {video && (
        <>
          <YStack fullscreen items="center" justify="center">
            <PlayIcon size={PLAY_ICON_SIZE} weight="fill" color={OVERLAY_INK} />
          </YStack>

          {durationSeconds != null && (
            <DurationBadge
              seconds={durationSeconds}
              t={DURATION_INSET}
              l={DURATION_INSET}
            />
          )}
        </>
      )}

      {onRemove && (
        <PhotoOverlayButton
          t="$2"
          r="$2"
          bg={DARK_FILL}
          label={t("diary.removeAttachment")}
          onPress={onRemove}
        >
          <XIcon
            size={PHOTO_OVERLAY_ICON_SIZE}
            weight="bold"
            color={theme.onFill.val}
          />
        </PhotoOverlayButton>
      )}

      {onMoveLeft && (
        <PhotoOverlayButton
          b="$2"
          l="$2"
          bg={DARK_FILL}
          label={t("diary.moveLeft")}
          onPress={onMoveLeft}
        >
          <CaretLeftIcon
            size={PHOTO_OVERLAY_ICON_SIZE}
            weight="bold"
            color={theme.onFill.val}
          />
        </PhotoOverlayButton>
      )}

      {onMoveRight && (
        <PhotoOverlayButton
          b="$2"
          r="$2"
          bg={DARK_FILL}
          label={t("diary.moveRight")}
          onPress={onMoveRight}
        >
          <CaretRightIcon
            size={PHOTO_OVERLAY_ICON_SIZE}
            weight="bold"
            color={theme.onFill.val}
          />
        </PhotoOverlayButton>
      )}
    </YStack>
  );
}

export function DiaryAttachmentStrip({
  items,
  onAdd,
  onRemove,
  onMove,
  onPress,
}: {
  items: DiaryDraftAttachment[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onMove?: (from: number, to: number) => void;
  onPress: (index: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ marginHorizontal: -SCREEN_PADDING }}
      contentContainerStyle={{
        gap: getTokens().space.$2.val,
        paddingHorizontal: SCREEN_PADDING,
      }}
    >
      {items.map((item, index) => (
        <Tile
          key={item.key}
          item={item}
          onPress={() => onPress(index)}
          onRemove={onRemove ? () => onRemove(index) : undefined}
          onMoveLeft={
            onMove && index > 0 ? () => onMove(index, index - 1) : undefined
          }
          onMoveRight={
            onMove && index < items.length - 1
              ? () => onMove(index, index + 1)
              : undefined
          }
        />
      ))}

      {onAdd && (
        <YStack
          width={TILE_SIZE}
          height={TILE_SIZE}
          rounded={PHOTO_TILE_RADIUS}
          bg="$grey100"
          items="center"
          justify="center"
          pressStyle={{ bg: "$grey200" }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t("diary.addAttachment")}
          onPress={onAdd}
        >
          <PlusIcon
            size={ADD_ICON_SIZE}
            weight="bold"
            color={theme.grey600.val}
          />
        </YStack>
      )}
    </ScrollView>
  );
}
