import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  return (
    <View className="flex-1 items-center justify-center">
      <Stack.Screen options={{ title: `방 ${roomId}` }} />
      <Text className="text-3xl font-bold">Chat Room</Text>
      <Text className="mt-2 text-base text-gray-500">roomId: {roomId}</Text>
    </View>
  );
}
