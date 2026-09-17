import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { Text, XStack, type XStackProps, YStack } from "tamagui";

import {
  BUTTON_DISABLED_OPACITY,
  BUTTON_SIZES,
  DARK_FILL,
  PRESS_DIM,
} from "@/lib/design";

// primary는 TDS의 fill primary, secondary는 weak dark, danger는 fill danger, dark는 fill dark다.
const VARIANTS = {
  primary: { bg: "$blue500", color: "$onFill" },
  secondary: { bg: "$greyOpacity100", color: "$grey700" },
  danger: { bg: "$red500", color: "$onFill" },
  dark: { bg: DARK_FILL, color: "$onFill" },
} as const;

type ButtonColor = (typeof VARIANTS)[keyof typeof VARIANTS]["color"];

const LOADING_DOT_COUNT = 3;

const LOADING_DOT_PULSE = 300;

const LOADING_DOT_DIM_OPACITY = 0.3;

// 흔히 불러오는 기본 부품이라 reanimated 대신 RN Animated를 쓴다. reanimated는 Jest에서
// worklets 초기화가 실패해 이 버튼을 거쳐 가는 테스트가 전부 깨진다.
function LoadingDots({
  size,
  gap,
  color,
}: {
  size: number;
  gap: number;
  color: ButtonColor;
}) {
  const [opacities] = useState(() =>
    Array.from(
      { length: LOADING_DOT_COUNT },
      () => new Animated.Value(LOADING_DOT_DIM_OPACITY),
    ),
  );

  useEffect(() => {
    const pulse = (opacity: Animated.Value) =>
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: LOADING_DOT_PULSE,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: LOADING_DOT_DIM_OPACITY,
          duration: LOADING_DOT_PULSE,
          useNativeDriver: true,
        }),
      ]);
    const loop = Animated.loop(
      Animated.stagger(LOADING_DOT_PULSE, opacities.map(pulse)),
    );

    loop.start();

    return () => loop.stop();
  }, [opacities]);

  return (
    <XStack position="absolute" gap={gap}>
      {opacities.map((opacity, index) => (
        <Animated.View key={index} style={{ opacity }}>
          <YStack width={size} height={size} rounded={size / 2} bg={color} />
        </Animated.View>
      ))}
    </XStack>
  );
}

export function Button({
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  onPress,
  children,
  ...props
}: Omit<XStackProps, "children"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  loading?: boolean;
  children: string;
}) {
  const spec = BUTTON_SIZES[size];
  const { bg, color } = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <XStack
      group
      minH={spec.height}
      minW={spec.minWidth}
      px={spec.paddingX}
      py={spec.paddingY}
      rounded={spec.radius}
      bg={bg}
      items="center"
      justify="center"
      overflow="hidden"
      opacity={disabled ? BUTTON_DISABLED_OPACITY : 1}
      accessibilityRole="button"
      onPress={inactive ? undefined : onPress}
      {...props}
      // 안드로이드는 aria-disabled가 빠지면 setEnabled(true)로 되돌리지 않는다.
      // 그러면 한 번 disabled였던 뷰가 계속 터치 대상에서 빠져 라벨만 눌리므로,
      // false일 때도 값을 실어 보내 복구시킨다.
      aria-disabled={inactive}
      aria-busy={loading}
    >
      <Text
        fontSize={spec.fontSize}
        fontWeight="600"
        color={color}
        text="center"
        opacity={loading ? 0 : 1}
      >
        {children}
      </Text>

      {loading && (
        <LoadingDots size={spec.dotSize} gap={spec.dotGap} color={color} />
      )}

      {!inactive && (
        <YStack
          fullscreen
          bg={PRESS_DIM}
          opacity={0}
          pointerEvents="none"
          $group-press={{ opacity: 1 }}
        />
      )}
    </XStack>
  );
}
