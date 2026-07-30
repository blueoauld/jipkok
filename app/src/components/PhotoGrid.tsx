import { Image } from "expo-image";
import {
  CaretLeftIcon,
  CaretRightIcon,
  CrownSimpleIcon,
  PlusIcon,
  XIcon,
} from "phosphor-react-native";
import { useTheme, XStack, YStack, type XStackProps } from "tamagui";

import { MAX_PHOTOS } from "@/hooks/usePhotos";

const COLUMNS = 3;

const OVERLAY_BUTTON_BG = "rgba(0, 0, 0, 0.5)";

type Cell =
  | { kind: "photo"; uri: string; index: number }
  | { kind: "add" }
  | null;

function toRows(photos: string[]): Cell[][] {
  const cells: Cell[] = photos.map((uri, index) => ({
    kind: "photo",
    uri,
    index,
  }));

  if (photos.length < MAX_PHOTOS) {
    cells.push({ kind: "add" });
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
      pressStyle={{ opacity: 0.6 }}
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
  showPrimaryBadge,
}: {
  photos: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onMove?: (from: number, to: number) => void;
  showPrimaryBadge?: boolean;
}) {
  const theme = useTheme();

  return (
    <YStack gap="$2">
      {toRows(photos).map((row, rowIndex) => (
        <XStack key={rowIndex} gap="$2">
          {row.map((cell, columnIndex) => {
            if (!cell) {
              return <YStack key={`empty-${columnIndex}`} flex={1} />;
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
                  pressStyle={{ opacity: 0.6 }}
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
              >
                <Image
                  source={cell.uri}
                  contentFit="cover"
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

                <OverlayButton
                  t="$2"
                  r="$2"
                  bg="$red10"
                  onPress={() => onRemove?.(cell.index)}
                >
                  <XIcon size={14} weight="bold" color="white" />
                </OverlayButton>

                {cell.index > 0 && (
                  <OverlayButton
                    b="$2"
                    l="$2"
                    bg={OVERLAY_BUTTON_BG}
                    onPress={() => onMove?.(cell.index, cell.index - 1)}
                  >
                    <CaretLeftIcon size={14} weight="bold" color="white" />
                  </OverlayButton>
                )}

                {cell.index < photos.length - 1 && (
                  <OverlayButton
                    b="$2"
                    r="$2"
                    bg={OVERLAY_BUTTON_BG}
                    onPress={() => onMove?.(cell.index, cell.index + 1)}
                  >
                    <CaretRightIcon size={14} weight="bold" color="white" />
                  </OverlayButton>
                )}
              </YStack>
            );
          })}
        </XStack>
      ))}
    </YStack>
  );
}
