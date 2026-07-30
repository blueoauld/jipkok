import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import {
  ChatCircleIcon,
  GearIcon,
  HouseIcon,
  TrophyIcon,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

const ICON_SIZE = 30;
const ICON_TOP_OFFSET = 6;
const TAB_BAR_HEIGHT = ICON_SIZE + 10 + 15 + ICON_TOP_OFFSET;

const TABS: { name: string; title: string; icon: Icon }[] = [
  { name: "main", title: "메인", icon: HouseIcon },
  { name: "chat", title: "채팅", icon: ChatCircleIcon },
  { name: "rank", title: "랭킹", icon: TrophyIcon },
  { name: "setting", title: "설정", icon: GearIcon },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.color10.val,
        tabBarInactiveTintColor: theme.color10.val,
        tabBarStyle: { height: TAB_BAR_HEIGHT + insets.bottom },
        tabBarIconStyle: {
          width: ICON_SIZE,
          height: ICON_SIZE,
          marginTop: ICON_TOP_OFFSET,
        },
      }}
    >
      {TABS.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
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
