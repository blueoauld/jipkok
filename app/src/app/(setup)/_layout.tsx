import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/session';

export default function SetupLayout() {
  const { status } = useSession();

  if (status === 'signedOut') {
    return <Redirect href="/login" />;
  }
  if (status === 'signedIn') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
