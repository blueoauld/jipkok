import * as Haptics from "expo-haptics";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { useTheme, XStack } from "tamagui";

import { MIN_TAP_SIZE, RETRO_BORDER_WIDTH } from "@/lib/design";

const ICON_SIZE = 22;

export function RetroDeleteButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  const press = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <XStack
      shrink={0}
      width={MIN_TAP_SIZE}
      height={MIN_TAP_SIZE}
      borderWidth={RETRO_BORDER_WIDTH}
      borderColor="$gray12"
      bg="$red10"
      items="center"
      justify="center"
      pressStyle={{ bg: "$red11" }}
      onPress={press}
    >
      <TrashIcon size={ICON_SIZE} weight="fill" color={theme.onFill.val} />
    </XStack>
  );
}
