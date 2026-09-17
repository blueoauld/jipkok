import { useRef, useState } from "react";
import { type LayoutRectangle, ScrollView } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Text, useTheme, XStack, YStack } from "tamagui";

import {
  PILL_RADIUS,
  SEGMENT_HEIGHT,
  SEGMENT_ITEM_HEIGHT,
  SEGMENT_ITEM_RADIUS,
  SEGMENT_RADIUS,
  TRANSITION,
} from "@/lib/design";

// TDS 세그먼트 컨트롤에서 잰 값이다.
const TRACK_PADDING_X = 5;
const TRACK_PADDING_Y = (SEGMENT_HEIGHT - SEGMENT_ITEM_HEIGHT) / 2;
const INDICATOR_SHADOW = "0 1px 2px rgba(0, 0, 0, 0.09)";

// fluid에서만 쓰는 값이다. 스크롤해서 가려진 쪽 끝을 흐리게 덮고, 처음에서 벗어나면 트랙 왼쪽
// 가장자리에 걸쳐 처음으로 돌아가는 화살표 버튼이 뜬다.
const FLUID_ITEM_PADDING_X = 12;
const FADE_WIDTH = 28;
const ARROW_BUTTON_SIZE = 24;
const ARROW_ICON_SIZE = 12;
const ARROW_ICON_PATH =
  "m4.069 8c0-.23.087-.46.263-.636l4.5-4.5c.226-.235.561-.331.877-.248.316.082.562.328.644.644.082.315-.012.651-.248.877l-3.864 3.864 3.864 3.864c.235.226.33.562.248.877-.082.316-.328.562-.644.644-.316.083-.651-.013-.877-.248l-4.5-4.5c-.168-.169-.263-.398-.263-.636";
// TDS 아이콘이 색을 고정값으로 박아 두어 다크에서도 같다.
const ARROW_ICON_COLOR = "#B0B8C1";
const EDGE_TOLERANCE = 1;

export type SegmentedItem<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  items: readonly SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
};

function Segment({
  label,
  selected,
  fluid,
  onLayout,
  onPress,
}: {
  label: string;
  selected: boolean;
  fluid: boolean;
  onLayout?: (layout: LayoutRectangle) => void;
  onPress: () => void;
}) {
  return (
    <XStack
      flex={fluid ? undefined : 1}
      height={SEGMENT_ITEM_HEIGHT}
      px={fluid ? FLUID_ITEM_PADDING_X : undefined}
      items="center"
      justify="center"
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onLayout={
        onLayout ? (event) => onLayout(event.nativeEvent.layout) : undefined
      }
      onPress={onPress}
    >
      <Text
        fontSize="$4"
        fontWeight={selected ? "600" : "500"}
        color={selected ? "$grey800" : "$grey600"}
      >
        {label}
      </Text>
    </XStack>
  );
}

function Indicator({
  top = 0,
  left = 0,
  x,
  width,
}: {
  top?: number;
  left?: number;
  x: number;
  width: number;
}) {
  return (
    <YStack
      position="absolute"
      t={top}
      l={left}
      width={width}
      height={SEGMENT_ITEM_HEIGHT}
      rounded={SEGMENT_ITEM_RADIUS}
      bg="$segmentedIndicator"
      boxShadow={INDICATOR_SHADOW}
      x={x}
      transition={TRANSITION}
    />
  );
}

function FixedSegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const itemWidth = (trackWidth - TRACK_PADDING_X * 2) / items.length;
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === value),
    0,
  );

  return (
    <XStack
      height={SEGMENT_HEIGHT}
      px={TRACK_PADDING_X}
      items="center"
      rounded={SEGMENT_RADIUS}
      bg="$greyOpacity100"
      accessibilityRole="radiogroup"
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {trackWidth > 0 && (
        <Indicator
          top={TRACK_PADDING_Y}
          left={TRACK_PADDING_X}
          x={selectedIndex * itemWidth}
          width={itemWidth}
        />
      )}

      {items.map((item) => (
        <Segment
          key={item.value}
          label={item.label}
          selected={item.value === value}
          fluid={false}
          onPress={() => onChange(item.value)}
        />
      ))}
    </XStack>
  );
}

function Fade({ side, visible }: { side: "left" | "right"; visible: boolean }) {
  const theme = useTheme();
  const id = `segmented-fade-${side}`;

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
              stopColor={theme.grey100.val}
              stopOpacity={side === "left" ? 1 : 0}
            />
            <Stop
              offset={1}
              stopColor={theme.grey100.val}
              stopOpacity={side === "left" ? 0 : 1}
            />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </YStack>
  );
}

function FluidSegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const scroll = useRef({ x: 0, viewWidth: 0, contentWidth: 0 });
  const [layouts, setLayouts] = useState<LayoutRectangle[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [atEnd, setAtEnd] = useState(true);
  const selected = layouts[items.findIndex((item) => item.value === value)];

  const updateEdges = () => {
    const { x, viewWidth, contentWidth } = scroll.current;

    setScrolled(x > EDGE_TOLERANCE);
    setAtEnd(x + viewWidth >= contentWidth - EDGE_TOLERANCE);
  };

  // 화살표 버튼이 트랙 밖으로 반쯤 나가도 눌리도록, 버튼 자리만큼 넓힌 틀 안에 트랙과 버튼을 둔다.
  return (
    <YStack mx={-ARROW_BUTTON_SIZE / 2}>
      <YStack
        mx={ARROW_BUTTON_SIZE / 2}
        height={SEGMENT_HEIGHT}
        rounded={SEGMENT_RADIUS}
        bg="$greyOpacity100"
        overflow="hidden"
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: TRACK_PADDING_X,
            paddingVertical: TRACK_PADDING_Y,
          }}
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
          <XStack accessibilityRole="radiogroup">
            {selected && <Indicator x={selected.x} width={selected.width} />}

            {items.map((item, index) => (
              <Segment
                key={item.value}
                label={item.label}
                selected={item.value === value}
                fluid
                onLayout={(layout) =>
                  setLayouts((previous) => {
                    const next = [...previous];
                    next[index] = layout;
                    return next;
                  })
                }
                onPress={() => onChange(item.value)}
              />
            ))}
          </XStack>
        </ScrollView>

        <Fade side="left" visible={scrolled} />
        <Fade side="right" visible={!atEnd} />
      </YStack>

      <YStack
        position="absolute"
        t={0}
        b={0}
        l={0}
        justify="center"
        opacity={scrolled ? 1 : 0}
        transition={TRANSITION}
        pointerEvents={scrolled ? "box-none" : "none"}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <XStack
          width={ARROW_BUTTON_SIZE}
          height={ARROW_BUTTON_SIZE}
          rounded={PILL_RADIUS}
          bg="$segmentedIndicator"
          boxShadow={INDICATOR_SHADOW}
          items="center"
          justify="center"
          onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })}
        >
          <Svg
            width={ARROW_ICON_SIZE}
            height={ARROW_ICON_SIZE}
            viewBox="0 0 16 16"
          >
            <Path
              d={ARROW_ICON_PATH}
              fill={ARROW_ICON_COLOR}
              fillRule="evenodd"
            />
          </Svg>
        </XStack>
      </YStack>
    </YStack>
  );
}

// fixed는 칸 폭을 똑같이 나누고, fluid는 칸을 글자 폭만큼 두고 넘치면 옆으로 스크롤한다.
export function SegmentedControl<T extends string>({
  alignment = "fixed",
  ...props
}: SegmentedControlProps<T> & { alignment?: "fixed" | "fluid" }) {
  return alignment === "fluid" ? (
    <FluidSegmentedControl {...props} />
  ) : (
    <FixedSegmentedControl {...props} />
  );
}
