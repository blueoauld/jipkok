import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Main' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="rank" options={{ title: 'Rank' }} />
      <Tabs.Screen name="setting" options={{ title: 'Setting' }} />
    </Tabs>
  );
}
