import { Text, YStack } from "tamagui";

const EMPTY_MESSAGE = "대화 내용이 없습니다.";

export default function ChatRoomScreen() {
  return (
    <YStack flex={1} justify="center" items="center" p="$4">
      <Text fontSize="$4">{EMPTY_MESSAGE}</Text>
    </YStack>
  );
}
