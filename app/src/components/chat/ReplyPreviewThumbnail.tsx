import { Image } from "expo-image";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { useTheme, XStack, YStack } from "tamagui";

import type { ReplyMessageResponse } from "@/lib/api";
import {
  IMAGE_TRANSITION,
  OVERLAY_BG,
  OVERLAY_INK,
  SQUARE_IMAGE_RADIUS_RATIO,
} from "@/lib/design";
import { photoCacheKey } from "@/lib/photo";

const SIZE = 44;
const PLAY_ICON_SIZE = 14;

export function ReplyPreviewThumbnail({
  reply,
}: {
  reply: ReplyMessageResponse;
}) {
  const theme = useTheme();

  if (!reply.previewUrl) {
    return null;
  }

  return (
    <YStack
      width={SIZE}
      height={SIZE}
      rounded={SIZE * SQUARE_IMAGE_RADIUS_RATIO}
      overflow="hidden"
    >
      <Image
        source={{
          uri: reply.previewUrl,
          cacheKey: photoCacheKey(reply.previewUrl),
        }}
        contentFit="cover"
        transition={IMAGE_TRANSITION}
        style={{
          width: SIZE,
          height: SIZE,
          backgroundColor: theme.grey100.val,
        }}
      />

      {reply.type === "VIDEO" && (
        <XStack fullscreen bg={OVERLAY_BG} items="center" justify="center">
          <PlayIcon size={PLAY_ICON_SIZE} weight="fill" color={OVERLAY_INK} />
        </XStack>
      )}
    </YStack>
  );
}
