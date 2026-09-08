import { Image } from "expo-image";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { CrownSimpleIcon } from "phosphor-react-native/src/icons/CrownSimple";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { memo } from "react";
import { useTheme, XStack, type XStackProps, YStack } from "tamagui";

import { LockBadge } from "@/components/ui/LockBadge";
import { RetroPressable } from "@/components/ui/RetroPressable";
import {
  COVER_IMAGE_STYLE,
  IMAGE_TRANSITION,
  PHOTO_PRESS_OPACITY,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET_SM,
} from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";
import { MAX_PHOTOS } from "@/lib/photo/picker";
import { useAccentToken } from "@/lib/theme/accent";

const COLUMNS = 3;

const CELL_ICON_SIZE = 22;

const BADGE_SIZE = 24;
const BADGE_ICON_SIZE = 14;

type Cell =
  | { kind: "photo"; uri: string; index: number }
  | { kind: "add" }
  | { kind: "placeholder" }
  | null;

function toRows(
  photos: string[],
  addable: boolean,
  showPlaceholders: boolean,
): Cell[][] {
  const cells: Cell[] = photos.map((uri, index) => ({
    kind: "photo",
    uri,
    index,
  }));

  if (addable && photos.length < MAX_PHOTOS) {
    cells.push({ kind: "add" });
  }

  if (showPlaceholders) {
    while (cells.length < MAX_PHOTOS) {
      cells.push({ kind: "placeholder" });
    }
  }

  const rows: Cell[][] = [];
  for (let start = 0; start < cells.length; start += COLUMNS) {
    const row = cells.slice(start, start + COLUMNS);
    while (row.length < COLUMNS) {
      row.push(null);
    }
    rows.push(row);
  }

  return rows;
}

function OverlayButton({
  children,
  bg,
  onPress,
  ...position
}: {
  children: React.ReactNode;
  bg: XStackProps["bg"];
  onPress?: () => void;
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
      pressStyle={onPress ? { opacity: PRESS_OPACITY } : undefined}
      onPress={onPress}
      {...position}
    >
      {children}
    </XStack>
  );
}

function Grid({
  photos,
  onAdd,
  onRemove,
  onMove,
  onPressPhoto,
  showPrimaryBadge,
  showPlaceholders,
  secretFrom,
}: {
  photos: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onMove?: (from: number, to: number) => void;
  onPressPhoto?: (index: number) => void;
  showPrimaryBadge?: boolean;
  showPlaceholders?: boolean;
  secretFrom?: number;
}) {
  const theme = useTheme();
  const accent = useAccentToken();

  return (
    <YStack gap="$2">
      {toRows(photos, Boolean(onAdd), Boolean(showPlaceholders)).map(
        (row, rowIndex) => (
          <XStack key={rowIndex} gap="$2">
            {row.map((cell, columnIndex) => {
              if (!cell) {
                return <YStack key={`empty-${columnIndex}`} flex={1} />;
              }

              if (cell.kind === "placeholder") {
                return (
                  <RetroPressable
                    key={`placeholder-${columnIndex}`}
                    flex={1}
                    shadow="$gray8"
                    offset={RETRO_SHADOW_OFFSET_SM}
                    aspectRatio={1}
                    rounded={0}
                    bg="$color1"
                    items="center"
                    justify="center"
                  >
                    <ImageIcon
                      size={CELL_ICON_SIZE}
                      color={theme.color12.val}
                    />
                  </RetroPressable>
                );
              }

              if (cell.kind === "add") {
                return (
                  <RetroPressable
                    key="add"
                    flex={1}
                    shadow="$gray8"
                    offset={RETRO_SHADOW_OFFSET_SM}
                    aspectRatio={1}
                    rounded={0}
                    bg="$color1"
                    pressBg="$gray6"
                    items="center"
                    justify="center"
                    onPress={onAdd}
                  >
                    <PlusIcon
                      size={CELL_ICON_SIZE}
                      weight="bold"
                      color={theme.color12.val}
                    />
                  </RetroPressable>
                );
              }

              return (
                <RetroPressable
                  key={cell.uri}
                  flex={1}
                  shadow="$gray8"
                  offset={RETRO_SHADOW_OFFSET_SM}
                  aspectRatio={1}
                  rounded={0}
                  overflow="hidden"
                  bg="$gray12"
                  pressOpacity={PHOTO_PRESS_OPACITY}
                  onPress={
                    onPressPhoto ? () => onPressPhoto(cell.index) : undefined
                  }
                >
                  <Image
                    source={{
                      uri: cell.uri,
                      cacheKey: photoCacheKey(cell.uri),
                    }}
                    cachePolicy={
                      secretFrom !== undefined && cell.index >= secretFrom
                        ? "memory"
                        : "disk"
                    }
                    contentFit="cover"
                    transition={IMAGE_TRANSITION}
                    style={COVER_IMAGE_STYLE}
                  />

                  {secretFrom !== undefined && cell.index >= secretFrom && (
                    <LockBadge t="$2" l="$2" />
                  )}

                  {showPrimaryBadge && cell.index === 0 && (
                    <OverlayButton t="$2" l="$2" bg={accent}>
                      <CrownSimpleIcon
                        size={BADGE_ICON_SIZE}
                        weight="fill"
                        color={theme.onFill.val}
                      />
                    </OverlayButton>
                  )}

                  {onRemove && (
                    <OverlayButton
                      t="$2"
                      r="$2"
                      bg="$red10"
                      onPress={() => onRemove(cell.index)}
                    >
                      <XIcon
                        size={BADGE_ICON_SIZE}
                        weight="bold"
                        color={theme.onFill.val}
                      />
                    </OverlayButton>
                  )}

                  {onMove && cell.index > 0 && (
                    <OverlayButton
                      b="$2"
                      l="$2"
                      bg="$color1"
                      onPress={() => onMove(cell.index, cell.index - 1)}
                    >
                      <CaretLeftIcon
                        size={BADGE_ICON_SIZE}
                        weight="bold"
                        color={theme.color12.val}
                      />
                    </OverlayButton>
                  )}

                  {onMove && cell.index < photos.length - 1 && (
                    <OverlayButton
                      b="$2"
                      r="$2"
                      bg="$color1"
                      onPress={() => onMove(cell.index, cell.index + 1)}
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
            })}
          </XStack>
        ),
      )}
    </YStack>
  );
}

export const PhotoGrid = memo(Grid);
