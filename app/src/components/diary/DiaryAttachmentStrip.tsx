import { Image } from "expo-image";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import {
  getTokens,
  Text,
  useTheme,
  XStack,
  type XStackProps,
  YStack,
} from "tamagui";

import { RetroPressable } from "@/components/ui/RetroPressable";
import {
  type DiaryDraftAttachment,
  draftDurationSeconds,
  draftPreviewUri,
  isDraftVideo,
} from "@/hooks/useDiaryAttachments";
import { mediaSummary } from "@/lib/chat";
import {
  COVER_IMAGE_STYLE,
  IMAGE_TRANSITION,
  OVERLAY_BG,
  OVERLAY_INK,
  PHOTO_PRESS_OPACITY,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET_SM,
} from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";
import { formatDuration } from "@/lib/video";

const TILE_SIZE = 96;
const ADD_ICON_SIZE = 22;
const PLAY_ICON_SIZE = 24;
const BADGE_SIZE = 24;
const BADGE_ICON_SIZE = 14;
const DURATION_INSET = 4;

function OverlayButton({
  label,
  bg,
  onPress,
  children,
  ...position
}: {
  label: string;
  bg: XStackProps["bg"];
  onPress: () => void;
  children: React.ReactNode;
} & XStackProps) {
  return (
    <XStack
      position="absolute"
      width={BADGE_SIZE}
      height={BADGE_SIZE}
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg={bg}
      items="center"
      justify="center"
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...position}
    >
      {children}
    </XStack>
  );
}

function Tile({
  item,
  onPress,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  item: DiaryDraftAttachment;
  onPress: () => void;
  onRemove: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const uri = draftPreviewUri(item);
  const video = isDraftVideo(item);
  const durationSeconds = draftDurationSeconds(item);

  return (
    <RetroPressable
      width={TILE_SIZE}
      height={TILE_SIZE}
      shadow="$gray8"
      offset={RETRO_SHADOW_OFFSET_SM}
      rounded={0}
      overflow="hidden"
      bg="$gray12"
      pressOpacity={PHOTO_PRESS_OPACITY}
      accessibilityRole="imagebutton"
      accessibilityLabel={mediaSummary(video ? "VIDEO" : "PHOTO")}
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
            <XStack
              position="absolute"
              t={DURATION_INSET}
              l={DURATION_INSET}
              px="$1"
              py={1}
              bg={OVERLAY_BG}
            >
              <Text fontSize="$2" color={OVERLAY_INK} fontWeight="600">
                {formatDuration(durationSeconds)}
              </Text>
            </XStack>
          )}
        </>
      )}

      <OverlayButton
        t="$2"
        r="$2"
        bg="$red10"
        label={t("diary.removeAttachment")}
        onPress={onRemove}
      >
        <XIcon size={BADGE_ICON_SIZE} weight="bold" color={theme.onFill.val} />
      </OverlayButton>

      {onMoveLeft && (
        <OverlayButton
          b="$2"
          l="$2"
          bg="$color1"
          label={t("diary.moveLeft")}
          onPress={onMoveLeft}
        >
          <CaretLeftIcon
            size={BADGE_ICON_SIZE}
            weight="bold"
            color={theme.color12.val}
          />
        </OverlayButton>
      )}

      {onMoveRight && (
        <OverlayButton
          b="$2"
          r="$2"
          bg="$color1"
          label={t("diary.moveRight")}
          onPress={onMoveRight}
        >
          <CaretRightIcon
            size={BADGE_ICON_SIZE}
            weight="bold"
            color={theme.color12.val}
          />
        </OverlayButton>
      )}
    </RetroPressable>
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
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onPress: (index: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const space = getTokens().space;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        gap: space.$3.val,
        paddingRight: RETRO_SHADOW_OFFSET_SM,
        paddingBottom: RETRO_SHADOW_OFFSET_SM,
      }}
    >
      {items.map((item, index) => (
        <Tile
          key={item.key}
          item={item}
          onPress={() => onPress(index)}
          onRemove={() => onRemove(index)}
          onMoveLeft={index > 0 ? () => onMove(index, index - 1) : undefined}
          onMoveRight={
            index < items.length - 1
              ? () => onMove(index, index + 1)
              : undefined
          }
        />
      ))}

      {onAdd && (
        <RetroPressable
          width={TILE_SIZE}
          height={TILE_SIZE}
          shadow="$gray8"
          offset={RETRO_SHADOW_OFFSET_SM}
          rounded={0}
          bg="$color1"
          pressBg="$gray6"
          items="center"
          justify="center"
          accessibilityRole="button"
          accessibilityLabel={t("diary.addAttachment")}
          onPress={onAdd}
        >
          <PlusIcon
            size={ADD_ICON_SIZE}
            weight="bold"
            color={theme.color12.val}
          />
        </RetroPressable>
      )}
    </ScrollView>
  );
}
