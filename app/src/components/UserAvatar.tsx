import { Image } from "expo-image";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { useTheme, YStack } from "tamagui";

const SIZE = 64;
const TRANSITION = 200;
const ICON_RATIO = 0.5;

export function UserAvatar({
  id,
  url,
  size = SIZE,
  circular,
}: {
  id: string;
  url?: string | null;
  size?: number;
  circular?: boolean;
}) {
  const theme = useTheme();

  return (
    <YStack
      shrink={0}
      width={size}
      height={size}
      rounded={circular ? 9999 : "$7"}
      overflow="hidden"
      bg="$gray5"
      items="center"
      justify="center"
    >
      {url ? (
        <Image
          source={url}
          recyclingKey={id}
          contentFit="cover"
          transition={TRANSITION}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <UserIcon size={size * ICON_RATIO} color={theme.gray9.val} />
      )}
    </YStack>
  );
}
