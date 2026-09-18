import { useTranslation } from "react-i18next";
import { YStack } from "tamagui";

import { Text } from "@/components/ui/Text";
import { CARD_RADIUS, SCREEN_PADDING } from "@/lib/design";

const MARGIN_Y = 16;
const CARD_PADDING = 16;

// 원스토어 심사 기준(대한민국)이 채팅방 안에 두도록 요구하는 불법행위 경고와 개인정보 요구 주의 안내다.
export function ChatSafetyNotice() {
  const { t } = useTranslation();

  return (
    <YStack
      mx={SCREEN_PADDING}
      my={MARGIN_Y}
      gap="$1"
      p={CARD_PADDING}
      rounded={CARD_RADIUS}
      bg="$greyOpacity100"
    >
      <Text preset="subStrong" color="$grey700">
        {t("chatRoom.safetyNoticeTitle")}
      </Text>

      <Text preset="note" color="$grey600">
        {t("chatRoom.safetyNotice")}
      </Text>
    </YStack>
  );
}
