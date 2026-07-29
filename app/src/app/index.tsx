import { Link, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, H2, YStack } from "tamagui";

const ROUTES: { href: Href; label: string }[] = [
  { href: "/login", label: "로그인" },
  { href: "/signup", label: "회원가입" },
  { href: "/main", label: "메인" },
];

export default function IndexScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} justify="center" gap="$3" px="$6" bg="$background">
        <H2 mb="$2" text="center">
          화면 이동
        </H2>

        {ROUTES.map((route) => (
          <Link key={route.label} href={route.href} asChild>
            <Button size="$5" theme="blue">
              {route.label}
            </Button>
          </Link>
        ))}
      </YStack>
    </SafeAreaView>
  );
}
