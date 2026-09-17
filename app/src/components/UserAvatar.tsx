import { Image } from "expo-image";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { useState } from "react";
import { useTheme, YStack } from "tamagui";

import type { Gender } from "@/lib/api";
import { IMAGE_TRANSITION, SQUARE_IMAGE_RADIUS_RATIO } from "@/lib/design";

export const USER_AVATAR_SIZE = 64;
const ICON_RATIO = 0.5;

const GENDER_BG = {
  MALE: "$blue6",
  FEMALE: "$pink6",
} as const satisfies Record<Gender, string>;

export function UserAvatar({
  id,
  url,
  size = USER_AVATAR_SIZE,
  gender,
}: {
  id: string;
  url?: string | null;
  size?: number;
  gender?: Gender;
}) {
  const theme = useTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = !!url && failedUrl === url;

  return (
    <YStack
      shrink={0}
      width={size}
      height={size}
      rounded={size * SQUARE_IMAGE_RADIUS_RATIO}
      overflow="hidden"
      bg={gender ? GENDER_BG[gender] : "$grey100"}
      items="center"
      justify="center"
    >
      {url && !failed ? (
        <Image
          source={url}
          recyclingKey={id}
          contentFit="cover"
          transition={IMAGE_TRANSITION}
          style={{ width: "100%", height: "100%" }}
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <UserIcon size={size * ICON_RATIO} color={theme.color12.val} />
      )}
    </YStack>
  );
}
