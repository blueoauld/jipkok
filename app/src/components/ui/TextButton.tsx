import { type TextProps, YStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { PRESS_OPACITY, tapSlop } from "@/lib/design";

const DIVIDER_HEIGHT = 14;
const DIVIDER_GAP = 12;

const LINE_HEIGHT = 26;
const TAP_SLOP = tapSlop({ height: LINE_HEIGHT });

// TDS TextButton의 기본 모양(clear, medium)이다. 문서 예제에서 글자 17, 굵기 500, grey600을 쟀다.
export function TextButton(props: TextProps) {
  return (
    <Text
      preset="label"
      color="$grey600"
      pressStyle={{ opacity: PRESS_OPACITY }}
      hitSlop={TAP_SLOP}
      accessibilityRole="button"
      {...props}
    />
  );
}

// 나란한 글자 버튼 사이의 세로 선이다. "|" 글자와 달리 화면 읽기가 읽지 않는다.
export function TextButtonDivider() {
  return (
    <YStack width={1} height={DIVIDER_HEIGHT} mx={DIVIDER_GAP} bg="$grey300" />
  );
}
