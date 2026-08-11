import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatRoomScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={{ title: "" }} />
    </SafeAreaView>
  );
}
