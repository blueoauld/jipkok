import { Stack } from "expo-router";
import { Text, YStack } from "tamagui";

const EMPTY_MESSAGE = "검색 결과가 없습니다.";

export default function ChatSearchScreen() {
  return (
    <YStack flex={1}>
      <Stack.Screen options={{ title: "채팅 검색" }} />

      <YStack flex={1} justify="center" items="center" p="$4">
        <Text fontSize="$4">{EMPTY_MESSAGE}</Text>
      </YStack>
    </YStack>
  );
}
