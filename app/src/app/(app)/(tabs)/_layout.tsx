import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { FireIcon } from "phosphor-react-native/src/icons/Fire";
import { GearIcon } from "phosphor-react-native/src/icons/Gear";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { TrophyIcon } from "phosphor-react-native/src/icons/Trophy";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import { TAB_BAR_HEIGHT } from "@/lib/design";

const ICON_SIZE = 30;
const BORDER_WIDTH = 2;

const HEADER_EDGE_PADDING = 4;

type Tab = {
  name: string;
  title: string;
  icon: Icon;
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
};

const TABS: Tab[] = [
  { name: "main", title: "메인", icon: HouseIcon },
  { name: "feed", title: "피드", icon: FireIcon },
  { name: "rank", title: "랭킹", icon: TrophyIcon },
  { name: "setting", title: "설정", icon: GearIcon },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

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
        tabBarActiveTintColor: theme.blue10.val,
        tabBarInactiveTintColor: theme.color12.val,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.color1.val,
                borderTopWidth: BORDER_WIDTH,
                borderColor: theme.color12.val,
              },
            ]}
          />
        ),
        tabBarIconStyle: {
          width: ICON_SIZE,
          flex: 1,
        },
      }}
    >
      {TABS.map(({ name, title, icon: Icon, headerLeft, headerRight }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            headerLeft,
            headerRight,
            tabBarIcon: ({ color }) => (
              <Icon color={color as string} size={ICON_SIZE} weight="fill" />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
