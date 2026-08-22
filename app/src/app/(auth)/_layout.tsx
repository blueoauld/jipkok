import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

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
