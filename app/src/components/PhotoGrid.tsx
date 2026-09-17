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
import {
  BADGE_SIZES,
  COVER_IMAGE_STYLE,
  DARK_FILL,
  IMAGE_TRANSITION,
  PHOTO_PRESS_OPACITY,
  PILL_RADIUS,
  PRESS_OPACITY,
} from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";
import { MAX_PHOTOS } from "@/lib/photo/picker";

const COLUMNS = 3;

const CELL_RADIUS = 12;
const CELL_ICON_SIZE = 22;

// 사진 위 버튼은 잠금 배지와 같은 크기의 원이다.
const OVERLAY_BUTTON_SIZE = BADGE_SIZES.small.height;
const OVERLAY_ICON_SIZE = 14;

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
      width={OVERLAY_BUTTON_SIZE}
      height={OVERLAY_BUTTON_SIZE}
      rounded={PILL_RADIUS}
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
                  <YStack
                    key={`placeholder-${columnIndex}`}
                    flex={1}
                    aspectRatio={1}
                    rounded={CELL_RADIUS}
                    bg="$grey100"
                    items="center"
                    justify="center"
                  >
                    <ImageIcon
                      size={CELL_ICON_SIZE}
                      color={theme.grey400.val}
                    />
                  </YStack>
                );
              }

              if (cell.kind === "add") {
                return (
                  <YStack
                    key="add"
                    flex={1}
                    aspectRatio={1}
                    rounded={CELL_RADIUS}
                    bg="$grey100"
                    items="center"
                    justify="center"
                    pressStyle={{ bg: "$grey200" }}
                    onPress={onAdd}
                  >
                    <PlusIcon
                      size={CELL_ICON_SIZE}
                      weight="bold"
                      color={theme.grey600.val}
                    />
                  </YStack>
                );
              }

              return (
                <YStack
                  key={cell.uri}
                  flex={1}
                  aspectRatio={1}
                  rounded={CELL_RADIUS}
                  overflow="hidden"
                  bg="$grey100"
                  pressStyle={
                    onPressPhoto ? { opacity: PHOTO_PRESS_OPACITY } : undefined
                  }
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
                    <OverlayButton t="$2" l="$2" bg="$blue500">
                      <CrownSimpleIcon
                        size={OVERLAY_ICON_SIZE}
                        weight="fill"
                        color={theme.onFill.val}
                      />
                    </OverlayButton>
                  )}

                  {onRemove && (
                    <OverlayButton
                      t="$2"
                      r="$2"
                      bg={DARK_FILL}
                      onPress={() => onRemove(cell.index)}
                    >
                      <XIcon
                        size={OVERLAY_ICON_SIZE}
                        weight="bold"
                        color={theme.onFill.val}
                      />
                    </OverlayButton>
                  )}

                  {onMove && cell.index > 0 && (
                    <OverlayButton
                      b="$2"
                      l="$2"
                      bg={DARK_FILL}
                      onPress={() => onMove(cell.index, cell.index - 1)}
                    >
                      <CaretLeftIcon
                        size={OVERLAY_ICON_SIZE}
                        weight="bold"
                        color={theme.onFill.val}
                      />
                    </OverlayButton>
                  )}

                  {onMove && cell.index < photos.length - 1 && (
                    <OverlayButton
                      b="$2"
                      r="$2"
                      bg={DARK_FILL}
                      onPress={() => onMove(cell.index, cell.index + 1)}
                    >
                      <CaretRightIcon
                        size={OVERLAY_ICON_SIZE}
                        weight="bold"
                        color={theme.onFill.val}
                      />
                    </OverlayButton>
                  )}
                </YStack>
              );
            })}
          </XStack>
        ),
      )}
    </YStack>
  );
}

export const PhotoGrid = memo(Grid);
