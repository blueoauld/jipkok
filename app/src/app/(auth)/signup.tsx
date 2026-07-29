import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useSession } from '@/features/auth/session';

export default function SignupScreen() {
  const { signUp } = useSession();

  return (
    <View className="flex-1 items-center justify-center gap-6 px-6">
      <Text className="text-3xl font-bold">Signup</Text>

      {/* 가입 성공 시 프로필이 비어 있으므로 needsSetup으로 넘어간다. */}
      <Pressable className="w-full rounded-xl bg-blue-500 py-4" onPress={signUp}>
        <Text className="text-center text-base font-semibold text-white">가입하기</Text>
      </Pressable>

      <Link href="/login" asChild>
        <Pressable className="px-4 py-2">
          <Text className="text-base text-blue-500">로그인으로</Text>
        </Pressable>
      </Link>
    </View>
  );
}
