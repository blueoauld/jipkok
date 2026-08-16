import { Image } from "expo-image";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { CrownSimpleIcon } from "phosphor-react-native/src/icons/CrownSimple";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { memo } from "react";
import { useTheme, XStack, type XStackProps, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { MAX_PHOTOS } from "@/hooks/usePhotos";
import {
  IMAGE_TRANSITION,
  PHOTO_PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET_SM,
} from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";
import { useAccentToken } from "@/lib/theme/accent";

const COLUMNS = 3;

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

function CellShadow() {
  return <RetroShadow color="$gray8" offset={RETRO_SHADOW_OFFSET_SM} />;
}

function OverlayButton({
  children,
  bg,
  onPress,
  ...position
}: {
  children: React.ReactNode;
  bg: XStackProps["bg"];
  onPress: () => void;
} & XStackProps) {
  return (
    <YStack position="absolute" {...position}>
      <RetroShadow color="$gray12" offset={RETRO_SHADOW_OFFSET_SM} />
      <XStack
        width={24}
        height={24}
        rounded={0}
        borderWidth={RETRO_BORDER_WIDTH}
        borderColor="$gray12"
        bg={bg}
        items="center"
        justify="center"
        pressStyle={{ x: RETRO_SHADOW_OFFSET_SM, y: RETRO_SHADOW_OFFSET_SM }}
        onPress={onPress}
      >
        {children}
      </XStack>
    </YStack>
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
                  <YStack key={`placeholder-${columnIndex}`} flex={1}>
                    <CellShadow />
                    <YStack
                      aspectRatio={1}
                      rounded={0}
                      borderWidth={RETRO_BORDER_WIDTH}
                      borderColor="$gray12"
                      bg="$color1"
                      items="center"
                      justify="center"
                    >
                      <ImageIcon size={24} color={theme.color12.val} />
                    </YStack>
                  </YStack>
                );
              }

              if (cell.kind === "add") {
                return (
                  <YStack key="add" flex={1}>
                    <CellShadow />
                    <YStack
                      aspectRatio={1}
                      rounded={0}
                      borderWidth={RETRO_BORDER_WIDTH}
                      borderColor="$gray12"
                      bg="$color1"
                      items="center"
                      justify="center"
                      pressStyle={{
                        x: RETRO_SHADOW_OFFSET_SM,
                        y: RETRO_SHADOW_OFFSET_SM,
                        bg: "$gray6",
                      }}
                      onPress={onAdd}
                    >
                      <PlusIcon
                        size={24}
                        weight="bold"
                        color={theme.color12.val}
                      />
                    </YStack>
                  </YStack>
                );
              }

              return (
                <YStack key={cell.uri} flex={1}>
                  <CellShadow />
                  <YStack
                    aspectRatio={1}
                    rounded={0}
                    borderWidth={RETRO_BORDER_WIDTH}
                    borderColor="$gray12"
                    overflow="hidden"
                    bg="$color1"
                    pressStyle={
                      onPressPhoto
                        ? {
                            x: RETRO_SHADOW_OFFSET_SM,
                            y: RETRO_SHADOW_OFFSET_SM,
                            opacity: PHOTO_PRESS_OPACITY,
                          }
                        : undefined
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
                      contentFit="cover"
                      transition={IMAGE_TRANSITION}
                      style={{ width: "100%", height: "100%" }}
                    />

                    {secretFrom !== undefined && cell.index >= secretFrom && (
                      <XStack
                        position="absolute"
                        t="$2"
                        l="$2"
                        width={24}
                        height={24}
                        rounded={0}
                        bg="$gray12"
                        items="center"
                        justify="center"
                      >
                        <LockSimpleIcon size={14} weight="fill" color="white" />
                      </XStack>
                    )}

                    {showPrimaryBadge && cell.index === 0 && (
                      <YStack position="absolute" t="$2" l="$2">
                        <RetroShadow
                          color="$gray12"
                          offset={RETRO_SHADOW_OFFSET_SM}
                        />
                        <XStack
                          width={24}
                          height={24}
                          rounded={0}
                          borderWidth={RETRO_BORDER_WIDTH}
                          borderColor="$gray12"
                          bg={accent}
                          items="center"
                          justify="center"
                        >
                          <CrownSimpleIcon
                            size={14}
                            weight="fill"
                            color="white"
                          />
                        </XStack>
                      </YStack>
                    )}

                    {onRemove && (
                      <OverlayButton
                        t="$2"
                        r="$2"
                        bg="$red10"
                        onPress={() => onRemove(cell.index)}
                      >
                        <XIcon size={14} weight="bold" color="white" />
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
                          size={14}
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
                          size={14}
                          weight="bold"
                          color={theme.color12.val}
                        />
                      </OverlayButton>
                    )}
                  </YStack>
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
