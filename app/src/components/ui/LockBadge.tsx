import { LockSimpleIcon } from "phosphor-react-native/src/icons/LockSimple";
import { useTheme, XStack, type XStackProps } from "tamagui";

const SIZE = 24;
const ICON_SIZE = 14;

// 비밀 사진 위에 얹는 자물쇠. 위치는 쓰는 쪽에서 준다.
// 배경 gray12는 다크에서 밝아지므로 아이콘은 반대편인 color1로 칠한다.
export function LockBadge(props: XStackProps) {
  const theme = useTheme();

  return (
    <XStack
      position="absolute"
      width={SIZE}
      height={SIZE}
      bg="$gray12"
      items="center"
      justify="center"
      {...props}
    >
      <LockSimpleIcon size={ICON_SIZE} weight="fill" color={theme.color1.val} />
    </XStack>
  );
}
