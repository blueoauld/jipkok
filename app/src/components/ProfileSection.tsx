import { YStack } from "tamagui";

import { Border } from "@/components/ui/Border";
import { ListHeader } from "@/components/ui/ListHeader";
import { Text } from "@/components/ui/Text";
import { copyText } from "@/lib/clipboard";
import { SCREEN_PADDING } from "@/lib/design";

// 글 아래에서 다음 띠까지의 거리다. TDS ListHeader 위 여백과 같게 둔다.
const BODY_PADDING_BOTTOM = 24;

// 상세 화면의 글 묶음이다. 회색 띠로 위 묶음과 나누고, 글은 TDS Post 본문(17, grey700)을 따른다.
export function ProfileSection({
  title,
  body,
  placeholder,
  copiedMessage,
}: {
  title: string;
  body?: string | null;
  placeholder?: string;
  copiedMessage: string;
}) {
  const empty = !body;

  return (
    <YStack>
      <Border variant="height16" />
      <ListHeader>{title}</ListHeader>
      <Text
        preset="body"
        px={SCREEN_PADDING}
        pb={BODY_PADDING_BOTTOM}
        color={empty ? "$grey500" : "$grey700"}
        onLongPress={empty ? undefined : () => copyText(body, copiedMessage)}
      >
        {empty ? placeholder : body}
      </Text>
    </YStack>
  );
}
