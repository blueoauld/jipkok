import { Modal, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import type { ChatMessageResponse, ChatReactionType } from "@/lib/api";
import {
  layoutActionOverlay,
  type MessageFrame,
} from "@/lib/chat/overlay-layout";
import { REACTION_EMOJI, REACTION_TYPES } from "@/lib/chat/reactions";
import { MIN_TAP_SIZE, PILL_RADIUS } from "@/lib/design";
import i18n from "@/lib/i18n";

const EMOJI_ITEM_SIZE = MIN_TAP_SIZE;
const EMOJI_FONT_SIZE = 22;
const BAR_PADDING = 4;
const BAR_HEIGHT = EMOJI_ITEM_SIZE + BAR_PADDING * 2;

// TDS Menu.Dropdown에서 잰 값이다. 항목 글자는 $4 줄높이 26에 위아래 8이다.
const MENU_RADIUS = 20;
const MENU_PADDING_Y = 10;
const MENU_ITEM_PADDING_X = 20;
const MENU_ITEM_PADDING_Y = 8;
const MENU_ITEM_HEIGHT = 26 + MENU_ITEM_PADDING_Y * 2;
const MENU_MIN_WIDTH = 180;
const MENU_SHADOW = "0 16px 60px rgba(0, 27, 55, 0.1)";

export type MessageAction = {
  label: string;
  onPress: () => void;
};

export type MessageActionTarget = {
  message: ChatMessageResponse;
  mine: boolean;
  frame: MessageFrame;
};

type Props = {
  target: MessageActionTarget | null;
  contentTop: number;
  reservedBottom: number;
  myReaction: ChatReactionType | null;
  actions: MessageAction[];
  onSelectReaction: (type: ChatReactionType) => void;
  onClose: () => void;
};

export function MessageActionOverlay({ target, onClose, ...props }: Props) {
  const visible = useVisibleWhenUnlocked(target !== null);

  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      {visible && target && (
        <Content target={target} onClose={onClose} {...props} />
      )}
    </Modal>
  );
}

function Content({
  target,
  contentTop,
  reservedBottom,
  myReaction,
  actions,
  onSelectReaction,
  onClose,
}: Props & { target: MessageActionTarget }) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { mine, frame } = target;
  const { barTop, menuTop, side } = layoutActionOverlay({
    frame,
    mine,
    barHeight: BAR_HEIGHT,
    menuHeight: actions.length * MENU_ITEM_HEIGHT + MENU_PADDING_Y * 2,
    window,
    insets,
    reservedTop: Math.max(0, contentTop - insets.top),
    reservedBottom,
  });

  return (
    <>
      <Pressable
        style={{ flex: 1, backgroundColor: theme.dimmedBackground.val }}
        accessibilityRole="button"
        accessibilityLabel={i18n.t("a11y.close")}
        onPress={onClose}
      />

      <XStack
        position="absolute"
        t={barTop}
        {...side}
        p={BAR_PADDING}
        gap={BAR_PADDING}
        rounded={PILL_RADIUS}
        bg="$floatBackground"
        boxShadow={MENU_SHADOW}
      >
        {REACTION_TYPES.map((type) => (
          <XStack
            key={type}
            width={EMOJI_ITEM_SIZE}
            height={EMOJI_ITEM_SIZE}
            rounded={PILL_RADIUS}
            items="center"
            justify="center"
            bg={type === myReaction ? "$blue50" : "transparent"}
            pressStyle={{
              bg: type === myReaction ? "$blue100" : "$greyOpacity100",
            }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={i18n.t(`a11y.reaction${type}`)}
            accessibilityState={{ selected: type === myReaction }}
            onPress={() => onSelectReaction(type)}
          >
            <Text fontSize={EMOJI_FONT_SIZE} lineHeight={EMOJI_FONT_SIZE + 6}>
              {REACTION_EMOJI[type]}
            </Text>
          </XStack>
        ))}
      </XStack>

      {actions.length > 0 && (
        <YStack
          position="absolute"
          t={menuTop}
          minW={MENU_MIN_WIDTH}
          {...side}
          py={MENU_PADDING_Y}
          rounded={MENU_RADIUS}
          bg="$floatBackground"
          boxShadow={MENU_SHADOW}
        >
          {actions.map(({ label, onPress }) => (
            <XStack
              key={label}
              height={MENU_ITEM_HEIGHT}
              px={MENU_ITEM_PADDING_X}
              items="center"
              pressStyle={{ bg: "$greyOpacity100" }}
              accessible
              accessibilityRole="button"
              onPress={onPress}
            >
              <Text
                fontSize="$4"
                lineHeight="$4"
                fontWeight="500"
                color="$grey700"
              >
                {label}
              </Text>
            </XStack>
          ))}
        </YStack>
      )}
    </>
  );
}
