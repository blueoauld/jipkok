import type { Icon, IconWeight } from "phosphor-react-native";
import { useTheme, XStack } from "tamagui";

import { GlassSurface } from "@/components/ui/GlassSurface";
import { HEADER_GLASS_SIZE, PRESS_OPACITY } from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

const ICON_SIZE = 28;

export function HeaderIconButton({
  icon: Icon,
  label,
  weight,
  onPress,
}: {
  icon: Icon;
  label: string;
  weight?: IconWeight;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <XStack
      items="center"
      justify="center"
      // 유리 원이 이미 탭 영역만 하다. 패딩을 더하면 묶인 아이콘 사이가 벌어진다.
      p={GLASS_ENABLED ? 0 : "$3"}
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <GlassSurface size={HEADER_GLASS_SIZE}>
        <Icon size={ICON_SIZE} weight={weight} color={theme.color.val} />
      </GlassSurface>
    </XStack>
  );
}
