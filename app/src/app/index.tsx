import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 개발용 화면 이동 허브. 로그인 흐름을 매번 통과하지 않고 바로 뛸 수 있다.
const ROUTES: { href: Href; label: string }[] = [
  { href: '/login', label: 'Login' },
  { href: '/signup', label: 'Signup' },
  { href: '/setup', label: 'Setup' },
  { href: '/main', label: 'Main (탭)' },
];

export default function DevIndexScreen() {
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 justify-center gap-3 px-6">
        <Text className="mb-2 text-center text-2xl font-bold">화면 이동</Text>

        {ROUTES.map((route) => (
          <Link key={route.label} href={route.href} asChild>
            <Pressable className="rounded-xl bg-blue-500 py-4">
              <Text className="text-center text-base font-semibold text-white">{route.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}
