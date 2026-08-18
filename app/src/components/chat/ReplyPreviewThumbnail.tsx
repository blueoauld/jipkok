import { Image } from "expo-image";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { useTheme, XStack, YStack } from "tamagui";

import type { ReplyMessageResponse } from "@/lib/api";
import { IMAGE_TRANSITION, OVERLAY_BG, RETRO_BORDER_WIDTH } from "@/lib/design";
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
    <YStack width={SIZE} height={SIZE}>
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
          borderWidth: RETRO_BORDER_WIDTH,
          borderColor: theme.gray12.val,
          backgroundColor: theme.gray12.val,
        }}
      />

      {reply.type === "VIDEO" && (
        <XStack fullscreen bg={OVERLAY_BG} items="center" justify="center">
          <PlayIcon size={PLAY_ICON_SIZE} weight="fill" color="white" />
        </XStack>
      )}
    </YStack>
  );
}
