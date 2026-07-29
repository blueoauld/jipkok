import { Stack } from 'expo-router';

import { SessionProvider, useSession } from '@/features/auth/session';

import '@/global.css';

function RootNavigator() {
  const { status } = useSession();

  // 토큰 확인이 끝나기 전에 화면을 그리면 로그인 화면이 깜빡였다가 사라진다.
  if (status === 'loading') {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
