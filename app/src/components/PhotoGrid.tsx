import { Image } from "expo-image";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { CrownSimpleIcon } from "phosphor-react-native/src/icons/CrownSimple";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useTheme, XStack, type XStackProps, YStack } from "tamagui";

import { MAX_PHOTOS } from "@/hooks/usePhotos";
import { OVERLAY_BG, PHOTO_PRESS_OPACITY, PRESS_OPACITY } from "@/lib/design";

const COLUMNS = 3;

const PHOTO_TRANSITION = 200;

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
  ...rest
}: { children: React.ReactNode } & XStackProps) {
  return (
    <XStack
      position="absolute"
      width={24}
      height={24}
      rounded={9999}
      items="center"
      justify="center"
      pressStyle={{ opacity: PRESS_OPACITY }}
      {...rest}
    >
      {children}
    </XStack>
  );
}

export function PhotoGrid({
  photos,
  onAdd,
  onRemove,
  onMove,
  onPressPhoto,
  showPrimaryBadge,
  showPlaceholders,
}: {
  photos: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onMove?: (from: number, to: number) => void;
  onPressPhoto?: (index: number) => void;
  showPrimaryBadge?: boolean;
  showPlaceholders?: boolean;
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
                    rounded="$7"
                    bg="$gray4"
                    items="center"
                    justify="center"
                  >
                    <ImageIcon size={24} color={theme.gray9.val} />
                  </YStack>
                );
              }

              if (cell.kind === "add") {
                return (
                  <YStack
                    key="add"
                    flex={1}
                    aspectRatio={1}
                    rounded="$7"
                    bg="$gray4"
                    items="center"
                    justify="center"
                    pressStyle={{ opacity: PRESS_OPACITY }}
                    onPress={onAdd}
                  >
                    <PlusIcon size={24} weight="bold" color={theme.gray9.val} />
                  </YStack>
                );
              }

              return (
                <YStack
                  key={cell.uri}
                  flex={1}
                  aspectRatio={1}
                  rounded="$7"
                  overflow="hidden"
                  bg="$gray4"
                  pressStyle={
                    onPressPhoto ? { opacity: PHOTO_PRESS_OPACITY } : undefined
                  }
                  onPress={
                    onPressPhoto ? () => onPressPhoto(cell.index) : undefined
                  }
                >
                  <Image
                    source={cell.uri}
                    contentFit="cover"
                    transition={PHOTO_TRANSITION}
                    style={{ width: "100%", height: "100%" }}
                  />

                  {showPrimaryBadge && cell.index === 0 && (
                    <XStack
                      position="absolute"
                      t="$2"
                      l="$2"
                      width={24}
                      height={24}
                      rounded={9999}
                      bg="$blue10"
                      items="center"
                      justify="center"
                    >
                      <CrownSimpleIcon size={14} weight="fill" color="white" />
                    </XStack>
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
                      bg={OVERLAY_BG}
                      onPress={() => onMove(cell.index, cell.index - 1)}
                    >
                      <CaretLeftIcon size={14} weight="bold" color="white" />
                    </OverlayButton>
                  )}

                  {onMove && cell.index < photos.length - 1 && (
                    <OverlayButton
                      b="$2"
                      r="$2"
                      bg={OVERLAY_BG}
                      onPress={() => onMove(cell.index, cell.index + 1)}
                    >
                      <CaretRightIcon size={14} weight="bold" color="white" />
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
