import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth/session';

export default function AuthLayout() {
  const { status } = useSession();

  if (status === 'needsSetup') {
    return <Redirect href="/setup" />;
  }
  if (status === 'signedIn') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
