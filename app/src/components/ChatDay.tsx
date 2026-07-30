import dayjs from "dayjs";
import type { DayProps } from "react-native-gifted-chat";
import { Text, XStack } from "tamagui";

const DATE_FORMAT = "YYYY[년] M[월] D[일] dddd";

export function ChatDay({ createdAt }: DayProps) {
  const date = dayjs(createdAt).locale("ko").format(DATE_FORMAT);

  return (
    <XStack justify="center" mt={5} mb={10}>
      <XStack bg="$gray4" rounded={9999} px="$2.5" py="$1.5">
        <Text theme="gray" color="$color10" fontSize="$2">
          {date}
        </Text>
      </XStack>
    </XStack>
  );
}
