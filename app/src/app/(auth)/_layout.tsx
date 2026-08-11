import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="login" options={{ title: "로그인" }} />
      <Stack.Screen name="signup" options={{ title: "회원가입" }} />
      <Stack.Screen
        name="setup"
        options={{
          title: "프로필 설정",
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
