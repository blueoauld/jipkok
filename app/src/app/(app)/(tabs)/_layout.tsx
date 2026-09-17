import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { BookOpenIcon } from "phosphor-react-native/src/icons/BookOpen";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { FireIcon } from "phosphor-react-native/src/icons/Fire";
import { GearIcon } from "phosphor-react-native/src/icons/Gear";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import { Border } from "@/components/ui/Border";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { formatUnreadCount } from "@/lib/chat";
import { useChatSelectionStore } from "@/lib/chat/store";
import { BOTTOM_BAR_HEIGHT, bottomBarHeight } from "@/lib/design";

const ICON_SIZE = 28;
const TAB_ITEM_PADDING = 5;
const TAB_ITEM_MAX_WIDTH = 500;

const BADGE_FONT_SIZE = 11;
const BADGE_TOP =
  (BOTTOM_BAR_HEIGHT - TAB_ITEM_PADDING * 2 - ICON_SIZE) / 2 - 3;

type TabTitleKey =
  "tabs.main" | "tabs.chat" | "tabs.lounge" | "tabs.diary" | "tabs.setting";

const TABS: { name: string; titleKey: TabTitleKey; icon: Icon }[] = [
  { name: "main", titleKey: "tabs.main", icon: HouseIcon },
  { name: "chat", titleKey: "tabs.chat", icon: ChatCircleIcon },
  { name: "feed", titleKey: "tabs.lounge", icon: FireIcon },
  { name: "diary", titleKey: "tabs.diary", icon: BookOpenIcon },
  { name: "setting", titleKey: "tabs.setting", icon: GearIcon },
];

function TabBarBackground() {
  const theme = useTheme();

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

// 안드로이드 탭 바다. iOS는 _layout.ios.tsx의 시스템 탭 바를 쓴다. 헤더는 탭마다 둔 스택이 그린다.
export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const unreadCount = useChatUnreadCount();
  // 채팅방을 고르는 동안에는 탭 바를 숨기고 그 자리에 고르기 버튼 줄이 온다.
  const chatSelecting = useChatSelectionStore((state) => state.active);

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.grey900.val,
        tabBarInactiveTintColor: theme.grey400.val,
        tabBarStyle: chatSelecting
          ? { display: "none" }
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
      {TABS.map(({ name, titleKey, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(titleKey),
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
      ))}
    </Tabs>
  );
}
