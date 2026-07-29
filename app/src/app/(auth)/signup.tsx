import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function SignupScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 px-6">
      <Text className="text-3xl font-bold">Signup</Text>

      <Link href="/login" asChild>
        <Pressable className="px-4 py-2">
          <Text className="text-base text-blue-500">로그인으로</Text>
        </Pressable>
      </Link>
    </View>
  );
}
