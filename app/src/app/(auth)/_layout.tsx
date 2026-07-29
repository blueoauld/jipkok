import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="login"
        options={{ headerShown: true, title: "로그인" }}
      />
      <Stack.Screen
        name="signup"
        options={{ headerShown: true, title: "회원가입" }}
      />
      <Stack.Screen
        name="setup"
        options={{ headerShown: true, title: "프로필 설정" }}
      />
    </Stack>
  );
}
