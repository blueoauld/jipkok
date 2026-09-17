import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme, YStack } from "tamagui";

import { BOTTOM_CTA_FADE_HEIGHT } from "@/lib/design";

// TDS 하단 고정 버튼(BottomCTA)에서 잰 값이다. 띠는 아래 25%까지 배경색이고 위로 투명해진다.
const FADE_SOLID_STOP = 0.25;
// react-native-svg는 그라디언트 id를 Svg마다 따로 가지므로 띠가 여러 개 떠 있어도 같은 id를 써도 된다.
const FADE_ID = "bottom-cta-fade";

// 하단 버튼 줄 위에 겹쳐 그 뒤로 지나가는 내용을 흐린다. 버튼 줄 상자 안에 둔다.
export function BottomCTAFade() {
  const theme = useTheme();

  return (
    <YStack
      position="absolute"
      t={-BOTTOM_CTA_FADE_HEIGHT}
      l={0}
      r={0}
      height={BOTTOM_CTA_FADE_HEIGHT}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={FADE_ID} x1="0" y1="1" x2="0" y2="0">
            <Stop
              offset={FADE_SOLID_STOP}
              stopColor={theme.background.val}
              stopOpacity={1}
            />
            <Stop offset={1} stopColor={theme.background.val} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${FADE_ID})`} />
      </Svg>
    </YStack>
  );
}
