import { Link } from 'expo-router';
import { FlatList, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO: 서버 붙일 때 features/chat의 훅으로 교체한다.
const MOCK_ROOMS = [
  { id: '1', name: '첫 번째 방' },
  { id: '2', name: '두 번째 방' },
  { id: '3', name: '세 번째 방' },
];

export default function ChatListScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <Text className="px-4 py-3 text-2xl font-bold">Chat</Text>

      <FlatList
        data={MOCK_ROOMS}
        keyExtractor={(room) => room.id}
        renderItem={({ item }) => (
          // NativeWind의 className은 Link에 먹지 않고, Link 안의 Text는 중첩 텍스트가 되어
          // padding/border가 무시된다. asChild로 Pressable에 스타일을 준다.
          <Link href={{ pathname: '/chat/[roomId]', params: { roomId: item.id } }} asChild>
            <Pressable className="border-b border-gray-200 px-4 py-4">
              <Text className="text-base">{item.name}</Text>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}
