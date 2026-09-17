import { Modal, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { RetroShadow } from "@/components/ui/RetroShadow";
import { useVisibleWhenUnlocked } from "@/hooks/useVisibleWhenUnlocked";
import type { ChatMessageResponse, ChatReactionType } from "@/lib/api";
import {
  layoutActionOverlay,
  type MessageFrame,
} from "@/lib/chat/overlay-layout";
import { REACTION_EMOJI, REACTION_TYPES } from "@/lib/chat/reactions";
import { MIN_TAP_SIZE, OVERLAY_BG, RETRO_BORDER_WIDTH } from "@/lib/design";
import i18n from "@/lib/i18n";

const EMOJI_ITEM_SIZE = MIN_TAP_SIZE;
const EMOJI_FONT_SIZE = 22;
const BAR_PADDING = 4;
const BAR_HEIGHT = EMOJI_ITEM_SIZE + BAR_PADDING * 2 + RETRO_BORDER_WIDTH * 2;

const MENU_ITEM_HEIGHT = 44;
const MENU_WIDTH = 160;

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

  const { mine, frame } = target;
  const { barTop, menuTop, side } = layoutActionOverlay({
    frame,
    mine,
    barHeight: BAR_HEIGHT,
    menuHeight: actions.length * MENU_ITEM_HEIGHT + RETRO_BORDER_WIDTH * 2,
    window,
    insets,
    reservedTop: Math.max(0, contentTop - insets.top),
    reservedBottom,
  });

  return (
    <>
      <Pressable
        style={{ flex: 1, backgroundColor: OVERLAY_BG }}
        accessibilityRole="button"
        accessibilityLabel={i18n.t("a11y.close")}
        onPress={onClose}
      />

      <YStack position="absolute" t={barTop} {...side}>
        <RetroShadow color="$gray12" />
        <XStack
          borderWidth={RETRO_BORDER_WIDTH}
          borderColor="$gray12"
          bg="$color1"
          p={BAR_PADDING}
          gap={BAR_PADDING}
        >
          {REACTION_TYPES.map((type) => (
            <XStack
              key={type}
              theme={type === myReaction ? "blue" : undefined}
              width={EMOJI_ITEM_SIZE}
              height={EMOJI_ITEM_SIZE}
              items="center"
              justify="center"
              bg={type === myReaction ? "$color10" : "transparent"}
              pressStyle={{ bg: type === myReaction ? "$color11" : "$color3" }}
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
      </YStack>

      {actions.length > 0 && (
        <YStack position="absolute" t={menuTop} width={MENU_WIDTH} {...side}>
          <RetroShadow color="$gray12" />
          <YStack
            borderWidth={RETRO_BORDER_WIDTH}
            borderColor="$gray12"
            bg="$color1"
          >
            {actions.map(({ label, onPress }) => (
              <XStack
                key={label}
                height={MENU_ITEM_HEIGHT}
                px="$3"
                items="center"
                pressStyle={{ bg: "$color3" }}
                accessibilityRole="button"
                onPress={onPress}
              >
                <Text fontSize="$4" color="$color12">
                  {label}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      )}
    </>
  );
}
