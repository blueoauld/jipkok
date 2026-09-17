import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { BookOpenIcon } from "phosphor-react-native/src/icons/BookOpen";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { FireIcon } from "phosphor-react-native/src/icons/Fire";
import { GearIcon } from "phosphor-react-native/src/icons/Gear";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import {
  ChatHeaderRight,
  SelectAllButton,
  SelectionCancelButton,
} from "@/components/chat/ChatTabHeader";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { Border } from "@/components/ui/Border";
import { Glass } from "@/components/ui/Glass";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { formatUnreadCount } from "@/lib/chat";
import { useChatSelectionStore } from "@/lib/chat/store";
import {
  BOTTOM_BAR_HEIGHT,
  bottomBarHeight,
  FLOATING_BAR_HEIGHT,
  FLOATING_BAR_RADIUS,
  floatingBarStyle,
} from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";
import i18n from "@/lib/i18n";
import { pushOnce } from "@/lib/router";

const ICON_SIZE = 28;
const TAB_ITEM_PADDING = 5;
const TAB_ITEM_MAX_WIDTH = 500;
// 유리일 때는 네이티브 스택 헤더가 버튼을 앉히는 자리와 같아야 화면을 오갈 때 안 튄다.
const HEADER_EDGE_PADDING = GLASS_ENABLED ? 16 : 4;

const BADGE_FONT_SIZE = 11;
const BAR_HEIGHT = GLASS_ENABLED ? FLOATING_BAR_HEIGHT : BOTTOM_BAR_HEIGHT;
const BADGE_TOP = (BAR_HEIGHT - TAB_ITEM_PADDING * 2 - ICON_SIZE) / 2 - 3;

type TabTitleKey =
  "tabs.main" | "tabs.chat" | "tabs.lounge" | "tabs.diary" | "tabs.setting";

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
        label={i18n.t("a11y.search")}
        onPress={() => pushOnce("/chat/search")}
      />
    ),
    headerRight: () => <ChatHeaderRight />,
  },
  { name: "feed", titleKey: "tabs.lounge", icon: FireIcon },
  { name: "diary", titleKey: "tabs.diary", icon: BookOpenIcon },
  { name: "setting", titleKey: "tabs.setting", icon: GearIcon },
];

function TabBarBackground() {
  const theme = useTheme();

  if (GLASS_ENABLED) {
    return (
      <Glass
        style={[StyleSheet.absoluteFill, { borderRadius: FLOATING_BAR_RADIUS }]}
      />
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: theme.background.val },
      ]}
    >
      <Border />
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
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
        tabBarActiveTintColor: theme.grey900.val,
        tabBarInactiveTintColor: theme.grey400.val,
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
                backgroundColor: theme.red500.val,
                color: theme.onFill.val,
                fontSize: BADGE_FONT_SIZE,
              },
              tabBarIcon: ({ color, focused }) => (
                <Icon
                  color={color as string}
                  size={ICON_SIZE}
                  weight={focused ? "fill" : "regular"}
                />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
