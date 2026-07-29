import { Link, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '없는 화면' }} />
      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-xl font-bold">이 화면은 존재하지 않습니다.</Text>
        <Link href="/" asChild>
          <Pressable className="px-4 py-2">
            <Text className="text-base text-blue-500">홈으로</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
