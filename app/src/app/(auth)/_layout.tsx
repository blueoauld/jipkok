import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

// 화면 오류를 여기서 먼저 잡아야 루트가 살아남아 쿼리 캐시가 유지된다.
export { AppErrorBoundary as ErrorBoundary } from "@/components/AppErrorBoundary";

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen name="login" options={{ title: t("auth.login.title") }} />
      <Stack.Screen name="signup" options={{ title: t("auth.signup.title") }} />
      <Stack.Screen
        name="password"
        options={{ title: t("auth.password.title") }}
      />
      <Stack.Screen
        name="setup"
        options={{
          title: t("auth.setup.title"),
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
