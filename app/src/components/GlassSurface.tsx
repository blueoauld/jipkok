import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { useTheme } from "tamagui";

const SURFACE_OPACITY = 0.9;

export function GlassSurface({
  tintColor,
  style,
  children,
}: {
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const theme = useTheme();

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tintColor} style={style}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={style}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.gray3.val, opacity: SURFACE_OPACITY },
        ]}
      />

      {children}
    </View>
  );
}
