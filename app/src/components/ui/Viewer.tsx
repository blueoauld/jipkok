import { XIcon } from "phosphor-react-native/src/icons/X";
import type { ReactNode } from "react";
import {
  Modal,
  StatusBar,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { XStack } from "tamagui";

import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import {
  MIN_TAP_SIZE,
  OVERLAY_BG,
  OVERLAY_INK,
  PILL_RADIUS,
  PRESS_OPACITY,
  VIEWER_BG,
} from "@/lib/design";
import i18n from "@/lib/i18n";

const CLOSE_ICON_SIZE = 22;

export function ViewerModal({
  open: requested,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const open = useVisibleWhenUnlocked(requested);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {open ? children : null}
    </Modal>
  );
}

// 안드로이드 Modal은 별도 루트라 제스처가 먹으려면 여기서 다시 감싸야 한다.
export function ViewerRoot({
  backdropStyle,
  children,
}: {
  backdropStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  children: ReactNode;
}) {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar barStyle="light-content" />

        <Animated.View style={[styles.backdrop, backdropStyle]} />

        {children}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// 사진과 영상 위에 얹는 반투명 검정 원 버튼이다.
export function ViewerRoundButton({
  label,
  size = MIN_TAP_SIZE,
  onPress,
  children,
}: {
  label: string;
  size?: number;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <XStack
      width={size}
      height={size}
      rounded={PILL_RADIUS}
      bg={OVERLAY_BG}
      items="center"
      justify="center"
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      {children}
    </XStack>
  );
}

export function ViewerCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <XStack p="$2">
      <ViewerRoundButton label={i18n.t("a11y.close")} onPress={onClose}>
        <XIcon size={CLOSE_ICON_SIZE} weight="bold" color={OVERLAY_INK} />
      </ViewerRoundButton>
    </XStack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: VIEWER_BG,
  },
});
