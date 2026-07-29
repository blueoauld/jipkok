import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup" options={{ headerShown: true, title: '프로필 설정' }} />
    </Stack>
  );
}
