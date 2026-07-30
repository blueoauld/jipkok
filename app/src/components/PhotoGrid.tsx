import { Image } from "expo-image";
import { PlusIcon, XIcon } from "phosphor-react-native";
import { useTheme, XStack, YStack } from "tamagui";

const COLUMNS = 3;
const MAX_PHOTOS = 6;

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

export function PhotoGrid({
  photos,
  onAdd,
  onRemove,
}: {
  photos: string[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
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

                <XStack
                  position="absolute"
                  t="$2"
                  r="$2"
                  width={24}
                  height={24}
                  rounded={9999}
                  bg="$red10"
                  items="center"
                  justify="center"
                  pressStyle={{ opacity: 0.6 }}
                  onPress={() => onRemove?.(cell.index)}
                >
                  <XIcon size={14} weight="bold" color="white" />
                </XStack>
              </YStack>
            );
          })}
        </XStack>
      ))}
    </YStack>
  );
}
