import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/session';

export default function AppLayout() {
  const { status } = useSession();

  if (status === 'signedOut') {
    return <Redirect href="/login" />;
  }
  if (status === 'needsSetup') {
    return <Redirect href="/setup" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* 채팅방은 탭 위를 덮는 풀스크린으로 띄운다.
          headerBackTitle을 주지 않으면 그룹 폴더명 "(tabs)"가 뒤로가기 라벨로 노출된다. */}
      <Stack.Screen name="chat/[roomId]" options={{ title: '', headerBackTitle: '뒤로' }} />
    </Stack>
  );
}
