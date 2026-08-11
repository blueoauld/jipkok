import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { FireIcon } from "phosphor-react-native/src/icons/Fire";
import { GearIcon } from "phosphor-react-native/src/icons/Gear";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { TrophyIcon } from "phosphor-react-native/src/icons/Trophy";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import { BellToggleButton } from "@/components/BellToggleButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";
import { formatUnreadCount } from "@/lib/chat/unread";
import { TAB_BAR_HEIGHT } from "@/lib/design";
import { pushOnce } from "@/lib/router";

const ICON_SIZE = 30;
const TAB_ITEM_PADDING = 5;
const BORDER_WIDTH = 2;

const BADGE_FONT_SIZE = 11;
const BADGE_TOP = (TAB_BAR_HEIGHT - TAB_ITEM_PADDING * 2 - ICON_SIZE) / 2 - 3;

type Tab = {
  name: string;
  title: string;
  icon: Icon;
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
};

const TABS: Tab[] = [
  { name: "main", title: "메인", icon: HouseIcon },
  {
    name: "chat",
    title: "채팅",
    icon: ChatCircleIcon,
    headerLeft: () => (
      <HeaderIconButton
        icon={MagnifyingGlassIcon}
        onPress={() => pushOnce("/chat/search")}
      />
    ),
    headerRight: () => <NoteReceiveButton />,
  },
  { name: "feed", title: "피드", icon: FireIcon },
  { name: "rank", title: "랭킹", icon: TrophyIcon },
  { name: "setting", title: "설정", icon: GearIcon },
];

const NOTE_RECEIVE_ON_MESSAGE = "이제 새로운 쪽지를 받을 수 있습니다.";
const NOTE_RECEIVE_OFF_MESSAGE = "이제 새로운 쪽지를 받지 않습니다.";

function NoteReceiveButton() {
  const { data: profile } = useMyProfile();

  return (
    <BellToggleButton
      enabled={profile?.noteReceiveEnabled ?? true}
      field="noteReceiveEnabled"
      update={api.members.updateNoteReceive}
      onMessage={NOTE_RECEIVE_ON_MESSAGE}
      offMessage={NOTE_RECEIVE_OFF_MESSAGE}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const unreadCount = useChatUnreadCount();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerTitleAlign: "center",
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
      ))}
    </Tabs>
  );
}
