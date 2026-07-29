import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";

export default function SettingScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <YStack flex={1} bg="$background" />
    </SafeAreaView>
  );
}
