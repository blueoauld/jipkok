import { useRef, useState } from "react";
import { ScrollView } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { useTheme, XStack, YStack } from "tamagui";

import { Button } from "@/components/ui/Button";
import {
  BUTTON_SIZES,
  PILL_RADIUS,
  SCREEN_PADDING,
  TRANSITION,
} from "@/lib/design";

// 가려진 칩이 있는 쪽에는 칩 높이의 화살표 버튼을 화면 좌우 여백 자리에 띄우고, 버튼 뒤는 배경색으로
// 덮은 뒤 안쪽으로 흐려지게 한다. 화살표를 누르면 흐림 띠에 걸린 칩이 반대쪽 띠 바로 안쪽에 오도록 넘기되,
// 그러고 남는 거리가 띠 폭보다 짧으면 끝까지 넘긴다. 화면 폭에 따라 조금만 남기고 멈추면 한 번 더 눌러야 한다.
const CHIP_HEIGHT = BUTTON_SIZES.medium.height;
const ARROW_ZONE = SCREEN_PADDING + CHIP_HEIGHT;
// 화살표 안쪽에서 투명해지는 거리다. TDS 세그먼트 fluid의 흐림 띠 폭을 따랐다.
const FADE_OUT_WIDTH = 28;
const FADE_WIDTH = ARROW_ZONE + FADE_OUT_WIDTH;
const FADE_SOLID_RATIO = ARROW_ZONE / FADE_WIDTH;
const ARROW_ICON_SIZE = 16;
// TDS 세그먼트 fluid의 왼쪽 꺾쇠 아이콘이다. 오른쪽은 좌우로 뒤집어 쓴다.
const ARROW_ICON_PATH =
  "m4.069 8c0-.23.087-.46.263-.636l4.5-4.5c.226-.235.561-.331.877-.248.316.082.562.328.644.644.082.315-.012.651-.248.877l-3.864 3.864 3.864 3.864c.235.226.33.562.248.877-.082.316-.328.562-.644.644-.316.083-.651-.013-.877-.248l-4.5-4.5c-.168-.169-.263-.398-.263-.636";
const EDGE_TOLERANCE = 1;

export type ChipItem<T extends string> = {
  value: T;
  label: string;
};

type Side = "left" | "right";

function EdgeFade({ side, visible }: { side: Side; visible: boolean }) {
  const theme = useTheme();
  const id = `chip-fade-${side}`;
  const color = theme.background.val;

  return (
    <YStack
      position="absolute"
      t={0}
      b={0}
      l={side === "left" ? 0 : undefined}
      r={side === "right" ? 0 : undefined}
      width={FADE_WIDTH}
      opacity={visible ? 1 : 0}
      transition={TRANSITION}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop
              offset={0}
              stopColor={color}
              stopOpacity={side === "left" ? 1 : 0}
            />
            <Stop
              offset={side === "left" ? FADE_SOLID_RATIO : 1 - FADE_SOLID_RATIO}
              stopColor={color}
            />
            <Stop
              offset={1}
              stopColor={color}
              stopOpacity={side === "left" ? 0 : 1}
            />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </YStack>
  );
}

function ArrowButton({
  side,
  visible,
  onPress,
}: {
  side: Side;
  visible: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      position="absolute"
      t={0}
      b={0}
      l={side === "left" ? SCREEN_PADDING : undefined}
      r={side === "right" ? SCREEN_PADDING : undefined}
      justify="center"
      opacity={visible ? 1 : 0}
      transition={TRANSITION}
      pointerEvents={visible ? "box-none" : "none"}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <XStack
        group
        width={CHIP_HEIGHT}
        height={CHIP_HEIGHT}
        rounded={PILL_RADIUS}
        bg="$greyOpacity100"
        overflow="hidden"
        items="center"
        justify="center"
        onPress={onPress}
      >
        <Svg
          width={ARROW_ICON_SIZE}
          height={ARROW_ICON_SIZE}
          viewBox="0 0 16 16"
          style={side === "right" ? { transform: [{ scaleX: -1 }] } : undefined}
        >
          <Path
            d={ARROW_ICON_PATH}
            fill={theme.grey700.val}
            fillRule="evenodd"
          />
        </Svg>

        <YStack
          fullscreen
          bg="$pressDim"
          opacity={0}
          pointerEvents="none"
          $group-press={{ opacity: 1 }}
        />
      </XStack>
    </YStack>
  );
}

export function ChipScroller<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly ChipItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const scroll = useRef({ x: 0, viewWidth: 0, contentWidth: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [atEnd, setAtEnd] = useState(true);

  const updateEdges = () => {
    const { x, viewWidth, contentWidth } = scroll.current;

    setScrolled(x > EDGE_TOLERANCE);
    setAtEnd(x + viewWidth >= contentWidth - EDGE_TOLERANCE);
  };

  const page = (direction: -1 | 1) => {
    const { x, viewWidth, contentWidth } = scroll.current;
    const end = contentWidth - viewWidth;
    const next = x + direction * (viewWidth - FADE_WIDTH * 2);

    scrollRef.current?.scrollTo({
      x: next > end - FADE_WIDTH ? end : next < FADE_WIDTH ? 0 : next,
      animated: true,
    });
  };

  return (
    <YStack>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING }}
        onLayout={(event) => {
          scroll.current.viewWidth = event.nativeEvent.layout.width;
          updateEdges();
        }}
        onContentSizeChange={(width) => {
          scroll.current.contentWidth = width;
          updateEdges();
        }}
        onScroll={(event) => {
          scroll.current.x = event.nativeEvent.contentOffset.x;
          updateEdges();
        }}
      >
        <XStack gap="$2">
          {items.map((item) => {
            const selected = item.value === value;

            return (
              <Button
                key={item.value}
                size="medium"
                variant={selected ? "dark" : "secondary"}
                accessibilityState={{ selected }}
                onPress={() => onChange(item.value)}
              >
                {item.label}
              </Button>
            );
          })}
        </XStack>
      </ScrollView>

      <EdgeFade side="left" visible={scrolled} />
      <EdgeFade side="right" visible={!atEnd} />
      <ArrowButton side="left" visible={scrolled} onPress={() => page(-1)} />
      <ArrowButton side="right" visible={!atEnd} onPress={() => page(1)} />
    </YStack>
  );
}
