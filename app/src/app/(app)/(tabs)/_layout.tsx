import { GlassView } from "expo-glass-effect";
import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { CheckSquareIcon } from "phosphor-react-native/src/icons/CheckSquare";
import { FireIcon } from "phosphor-react-native/src/icons/Fire";
import { GearIcon } from "phosphor-react-native/src/icons/Gear";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { TrophyIcon } from "phosphor-react-native/src/icons/Trophy";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, XStack } from "tamagui";

import { BellToggleButton } from "@/components/BellToggleButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";
import { formatUnreadCount } from "@/lib/chat";
import { useChatSelectionStore } from "@/lib/chat/store";
import {
  BOTTOM_BAR_HEIGHT,
  bottomBarHeight,
  FLOATING_BAR_HEIGHT,
  FLOATING_BAR_RADIUS,
  floatingBarStyle,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import { GLASS_ENABLED, useGlassColorScheme } from "@/lib/glass";
import { pushOnce } from "@/lib/router";
import { useAccentColor } from "@/lib/theme/accent";

const ICON_SIZE = 30;
const TAB_ITEM_PADDING = 5;
const TAB_ITEM_MAX_WIDTH = 500;
// 유리일 때는 네이티브 스택 헤더가 버튼을 앉히는 자리와 같아야 화면을 오갈 때 안 튄다.
const HEADER_EDGE_PADDING = GLASS_ENABLED ? 16 : 4;

const BADGE_FONT_SIZE = 11;
const BAR_HEIGHT = GLASS_ENABLED ? FLOATING_BAR_HEIGHT : BOTTOM_BAR_HEIGHT;
const BADGE_TOP = (BAR_HEIGHT - TAB_ITEM_PADDING * 2 - ICON_SIZE) / 2 - 3;

type TabTitleKey =
  "tabs.main" | "tabs.chat" | "tabs.lounge" | "tabs.rank" | "tabs.setting";

type Tab = {
  name: string;
  titleKey: TabTitleKey;
  icon: Icon;
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
};

const TABS: Tab[] = [
  { name: "main", titleKey: "tabs.main", icon: HouseIcon },
  {
    name: "chat",
    titleKey: "tabs.chat",
    icon: ChatCircleIcon,
    headerLeft: () => (
      <HeaderIconButton
        icon={MagnifyingGlassIcon}
        onPress={() => pushOnce("/chat/search")}
      />
    ),
    headerRight: () => <ChatHeaderRight />,
  },
  { name: "feed", titleKey: "tabs.lounge", icon: FireIcon },
  { name: "rank", titleKey: "tabs.rank", icon: TrophyIcon },
  { name: "setting", titleKey: "tabs.setting", icon: GearIcon },
];

function NoteReceiveButton() {
  const { t } = useTranslation();
  const { data: profile } = useMyProfile();

  return (
    <BellToggleButton
      enabled={profile?.noteReceiveEnabled ?? true}
      field="noteReceiveEnabled"
      update={api.members.updateNoteReceive}
      onMessage={t("tabs.noteReceiveOn")}
      offMessage={t("tabs.noteReceiveOff")}
    />
  );
}

function HeaderTextButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <XStack
      items="center"
      justify="center"
      px="$3"
      py="$2"
      pressStyle={{ opacity: PRESS_OPACITY }}
      onPress={onPress}
    >
      <Text fontSize="$4" fontWeight="600">
        {label}
      </Text>
    </XStack>
  );
}

// 레트로 테두리는 유리와 같이 못 쓴다. 유리가 자기 경계를 그리는데 그 위에 검은 2px을
// 얹으면 둘 다 죽는다.
function TabBarBackground() {
  const theme = useTheme();
  const scheme = useGlassColorScheme();

  if (GLASS_ENABLED) {
    return (
      <GlassView
        style={[StyleSheet.absoluteFill, { borderRadius: FLOATING_BAR_RADIUS }]}
        colorScheme={scheme}
      />
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: theme.color1.val,
          borderTopWidth: RETRO_BORDER_WIDTH,
          borderColor: theme.gray12.val,
        },
      ]}
    />
  );
}

function ChatHeaderRight() {
  const startSelection = useChatSelectionStore((state) => state.start);

  return (
    <HeaderIconGroup>
      <HeaderIconButton icon={CheckSquareIcon} onPress={startSelection} />
      <NoteReceiveButton />
    </HeaderIconGroup>
  );
}

function SelectionCancelButton() {
  const { t } = useTranslation();
  const endSelection = useChatSelectionStore((state) => state.end);

  return <HeaderTextButton label={t("tabs.cancel")} onPress={endSelection} />;
}

function SelectAllButton() {
  const { t } = useTranslation();
  const selectedCount = useChatSelectionStore((state) => state.selected.size);
  const roomCount = useChatSelectionStore((state) => state.roomIds.length);
  const selectAll = useChatSelectionStore((state) => state.selectAll);
  const clear = useChatSelectionStore((state) => state.clear);

  const all = roomCount > 0 && selectedCount >= roomCount;

  return (
    <HeaderTextButton
      label={all ? t("tabs.deselectAll") : t("tabs.selectAll")}
      onPress={all ? clear : selectAll}
    />
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const accent = useAccentColor();
  const unreadCount = useChatUnreadCount();
  const chatSelecting = useChatSelectionStore((state) => state.active);
  const selectedCount = useChatSelectionStore((state) => state.selected.size);

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerTitleAlign: "center",
        headerLeftContainerStyle: { paddingLeft: HEADER_EDGE_PADDING },
        headerRightContainerStyle: { paddingRight: HEADER_EDGE_PADDING },
        tabBarShowLabel: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: theme.color12.val,
        // 유리 바만 띄운다. 덮이는 만큼은 useTabBarOverlay가 비운다.
        tabBarStyle: GLASS_ENABLED
          ? {
              ...floatingBarStyle(insets.bottom),
              borderTopWidth: 0,
              backgroundColor: "transparent",
              elevation: 0,
            }
          : {
              height: bottomBarHeight(insets.bottom),
              paddingBottom: insets.bottom,
              borderTopWidth: 0,
              backgroundColor: "transparent",
              elevation: 0,
            },
        tabBarBackground: () => <TabBarBackground />,
        tabBarItemStyle: { maxWidth: TAB_ITEM_MAX_WIDTH },
        tabBarIconStyle: { width: ICON_SIZE, flex: 1 },
      }}
    >
      {TABS.map(({ name, titleKey, icon: Icon, headerLeft, headerRight }) => {
        const selecting = name === "chat" && chatSelecting;

        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: selecting
                ? t("tabs.selectedCount", { count: selectedCount })
                : t(titleKey),
              headerLeft: selecting
                ? () => <SelectionCancelButton />
                : headerLeft,
              headerRight: selecting ? () => <SelectAllButton /> : headerRight,
              tabBarBadge:
                name === "chat" && unreadCount > 0
                  ? formatUnreadCount(unreadCount)
                  : undefined,
              tabBarBadgeStyle: {
                top: BADGE_TOP,
                backgroundColor: theme.red10.val,
                color: "white",
                fontSize: BADGE_FONT_SIZE,
              },
              tabBarIcon: ({ color }) => (
                <Icon color={color as string} size={ICON_SIZE} weight="fill" />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
