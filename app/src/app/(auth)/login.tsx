import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";

export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <YStack flex={1} bg="$background" />
    </SafeAreaView>
  );
}
