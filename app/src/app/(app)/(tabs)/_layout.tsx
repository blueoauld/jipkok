import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import {
  ChatCircleIcon,
  FireIcon,
  GearIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import { BellToggleButton } from "@/components/BellToggleButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";
import { formatUnreadCount } from "@/lib/chat/unread";
import { pushOnce } from "@/lib/router";

const ICON_SIZE = 30;
const ICON_TOP_OFFSET = 6;
const TAB_BAR_HEIGHT = ICON_SIZE + 10 + 15 + ICON_TOP_OFFSET;

const BADGE_FONT_SIZE = 11;

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
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync();
        },
      }}
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
              backgroundColor: theme.red10.val,
              color: "white",
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
