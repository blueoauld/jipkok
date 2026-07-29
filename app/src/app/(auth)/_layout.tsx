import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, headerShadowVisible: false }}>
      <Stack.Screen
        name="login"
        options={{ headerShown: true, title: "로그인" }}
      />
    </Stack>
  );
}
