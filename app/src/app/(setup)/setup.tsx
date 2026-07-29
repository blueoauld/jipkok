import { Pressable, Text, View } from 'react-native';

import { useSession } from '@/features/auth/session';

export default function SetupScreen() {
  const { completeSetup, signOut } = useSession();

  return (
    <View className="flex-1 items-center justify-center gap-6 px-6">
      <Text className="text-3xl font-bold">Setup</Text>
      <Text className="text-center text-base text-gray-500">닉네임, 프로필 이미지 설정</Text>

      <Pressable className="w-full rounded-xl bg-blue-500 py-4" onPress={completeSetup}>
        <Text className="text-center text-base font-semibold text-white">완료</Text>
      </Pressable>

      <Pressable onPress={signOut}>
        <Text className="text-base text-gray-500">나중에 하기 (로그아웃)</Text>
      </Pressable>
    </View>
  );
}
