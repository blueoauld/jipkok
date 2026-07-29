import { Stack } from "expo-router";

import "@/global.css";

function RootNavigator() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return <RootNavigator />;
}
