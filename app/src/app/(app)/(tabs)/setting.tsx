import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth/session';

export default function SettingScreen() {
  const { signOut } = useSession();

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-6">
        <Text className="text-3xl font-bold">Setting</Text>

        <Pressable className="rounded-xl bg-gray-200 px-6 py-3" onPress={signOut}>
          <Text className="text-base font-semibold">로그아웃</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
