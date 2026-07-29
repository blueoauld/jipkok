import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingScreen() {
  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1 items-center justify-center gap-6">
        <Text className="text-3xl font-bold">Setting</Text>
      </View>
    </SafeAreaView>
  );
}
