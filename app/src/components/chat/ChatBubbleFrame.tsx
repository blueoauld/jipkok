import type { ReactNode } from "react";
import Svg, { Path } from "react-native-svg";
import { useTheme, YStack } from "tamagui";

import { CHAT_BUBBLE_RADIUS } from "@/lib/design";

// TDS Bubble에서 잰 값이다. TDS는 꼬리를 아래 모서리에 달지만, 상대 사진과 이름 쪽을 가리키도록 위아래를
// 뒤집어 위 모서리에 단다. 꼬리는 모서리에서 바깥으로 5만큼 나간다.
const TAIL_WIDTH = 13;
const TAIL_HEIGHT = 17;
export const BUBBLE_TAIL_OVERHANG = 5;
const TAIL_PATH =
  "M11.992 17c1.102.007 1.404-1.512.383-1.926-2.652-1.078-4.503-3.718-4.521-6.63V0h-2v.892C5.854 5.405 3.8 9.56.386 12.206c-.559.433-.504 1.293.105 1.652C3.898 15.865 7.922 16.974 11.992 17z";

export function BubbleFrame({
  mine,
  tail,
  children,
  onLongPress,
}: {
  mine: boolean;
  tail: boolean;
  children: ReactNode;
  onLongPress: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      shrink={1}
      rounded={CHAT_BUBBLE_RADIUS}
      bg={mine ? "$blue500" : "$grey200"}
      onLongPress={onLongPress}
    >
      {children}

      {tail && (
        <Svg
          width={TAIL_WIDTH}
          height={TAIL_HEIGHT}
          viewBox={`0 0 ${TAIL_WIDTH} ${TAIL_HEIGHT}`}
          style={
            mine
              ? {
                  position: "absolute",
                  top: 0,
                  right: -BUBBLE_TAIL_OVERHANG,
                  transform: [{ scaleY: -1 }],
                }
              : {
                  position: "absolute",
                  top: 0,
                  left: -BUBBLE_TAIL_OVERHANG,
                  transform: [{ scaleX: -1 }, { scaleY: -1 }],
                }
          }
        >
          <Path
            d={TAIL_PATH}
            fill={mine ? theme.blue500.val : theme.grey200.val}
          />
        </Svg>
      )}
    </YStack>
  );
}
