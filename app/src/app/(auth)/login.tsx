import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useSession } from '@/features/auth/session';

export default function LoginScreen() {
  const { signIn } = useSession();

  return (
    <View className="flex-1 items-center justify-center gap-6 px-6">
      <Text className="text-3xl font-bold">Login</Text>

      <Pressable className="w-full rounded-xl bg-blue-500 py-4" onPress={signIn}>
        <Text className="text-center text-base font-semibold text-white">로그인</Text>
      </Pressable>

      {/* NativeWind는 Link에 className을 적용하지 못한다. asChild로 Pressable에 준다. */}
      <Link href="/signup" asChild>
        <Pressable className="px-4 py-2">
          <Text className="text-base text-blue-500">회원가입</Text>
        </Pressable>
      </Link>
    </View>
  );
}
