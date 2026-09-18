import type { TextProps } from "tamagui";

import { Text } from "@/components/ui/Text";
import { splitLinks } from "@/lib/chat/links";
import { openWebPage } from "@/lib/support";
import { showToast } from "@/lib/toast/store";

// TDS Bubble의 본문이다. 이모지 하나만 보내면 크게 띄운다.
const FONT_SIZE = 16;
const LINE_HEIGHT = 24;
const EMOJI_FONT_SIZE = 40;

const openLink = (url: string) =>
  openWebPage(url, (_variant, message) => showToast("error", message));

// 링크 위에서 길게 눌러도 말풍선 메뉴가 떠야 하므로 onLongPress를 같이 받는다.
// Tamagui Text는 중첩돼도 부모 색을 물려받지 않아 색을 따로 준다.
function LinkText({
  url,
  color,
  children,
  onLongPress,
}: {
  url: string;
  color: TextProps["color"];
  children: string;
  onLongPress: () => void;
}) {
  return (
    <Text
      color={color}
      textDecorationLine="underline"
      accessibilityRole="link"
      onPress={() => openLink(url)}
      onLongPress={onLongPress}
    >
      {children}
    </Text>
  );
}

export function BodyText({
  mine,
  content,
  large = false,
  onLongPress,
}: {
  mine: boolean;
  content: string;
  large?: boolean;
  onLongPress: () => void;
}) {
  const color = mine ? "$onFill" : "$grey800";

  return (
    <Text
      fontSize={large ? EMOJI_FONT_SIZE : FONT_SIZE}
      lineHeight={large ? undefined : LINE_HEIGHT}
      color={color}
    >
      {splitLinks(content).map((segment, index) =>
        segment.url ? (
          <LinkText
            key={index}
            url={segment.url}
            color={color}
            onLongPress={onLongPress}
          >
            {segment.text}
          </LinkText>
        ) : (
          segment.text
        ),
      )}
    </Text>
  );
}
