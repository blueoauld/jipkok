import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatListScreen() {
  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <Text className="px-4 py-3 text-2xl font-bold">Chat</Text>
    </SafeAreaView>
  );
}
