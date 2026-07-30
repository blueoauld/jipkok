import { Image } from "expo-image";
import { YStack } from "tamagui";

const SIZE = 64;
const TRANSITION = 200;

export function UserAvatar({
  id,
  size = SIZE,
  circular,
}: {
  id: string;
  size?: number;
  circular?: boolean;
}) {
  return (
    <YStack
      shrink={0}
      width={size}
      height={size}
      rounded={circular ? 9999 : "$7"}
      overflow="hidden"
      bg="$gray5"
    >
      <Image
        source={`https://picsum.photos/seed/${id}/200`}
        recyclingKey={id}
        contentFit="cover"
        transition={TRANSITION}
        style={{ width: "100%", height: "100%" }}
      />
    </YStack>
  );
}
