import { Image } from "expo-image";
import { useTheme } from "tamagui";

import { ListRow } from "@/components/ui/ListRow";
import { Text } from "@/components/ui/Text";
import type { DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam } from "@/lib/date";
import {
  IMAGE_TRANSITION,
  LIST_ROW_EVEN_PADDING_Y,
  SQUARE_IMAGE_RADIUS_RATIO,
} from "@/lib/design";
import { moodEmoji } from "@/lib/diary";
import { photoCacheKey } from "@/lib/photo";

const THUMBNAIL_SIZE = 56;

export function DiaryRow({
  diary,
  onPress,
}: {
  diary: DiaryResponse;
  onPress: (entryDate: string) => void;
}) {
  const theme = useTheme();
  const emoji = moodEmoji(diary.mood);
  const cover = diary.attachments[0];
  const coverUri = cover ? (cover.thumbnailUrl ?? cover.url) : null;

  return (
    <ListRow
      horizontalPadding="small"
      verticalPadding={LIST_ROW_EVEN_PADDING_Y}
      right={
        coverUri && (
          <Image
            source={{ uri: coverUri, cacheKey: photoCacheKey(coverUri) }}
            contentFit="cover"
            transition={IMAGE_TRANSITION}
            style={{
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              borderRadius: THUMBNAIL_SIZE * SQUARE_IMAGE_RADIUS_RATIO,
              backgroundColor: theme.grey100.val,
            }}
          />
        )
      }
      onPress={() => onPress(diary.entryDate)}
    >
      <Text preset="label" color="$grey800">
        {emoji ? `${emoji} ` : ""}
        {formatFullDate(fromDateParam(diary.entryDate))}
      </Text>

      {diary.content != null && (
        <Text preset="sub" numberOfLines={2} color="$grey600">
          {diary.content}
        </Text>
      )}
    </ListRow>
  );
}
