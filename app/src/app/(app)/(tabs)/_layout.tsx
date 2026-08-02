import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import {
  BellIcon,
  BellSlashIcon,
  ChatCircleIcon,
  FireIcon,
  GearIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { MY_PROFILE_KEY, useMyProfile } from "@/hooks/useMyProfile";
import { alertApiError, alertInfo } from "@/lib/alert";
import { api } from "@/lib/api";
import { pushOnce } from "@/lib/router";

const ICON_SIZE = 30;
const ICON_TOP_OFFSET = 6;
const TAB_BAR_HEIGHT = ICON_SIZE + 10 + 15 + ICON_TOP_OFFSET;

const MAX_BADGE_COUNT = 300;
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
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const enabled = profile?.noteReceiveEnabled ?? true;

  const toggle = useMutation({
    mutationFn: () => api.members.updateNoteReceive(!enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      alertInfo(enabled ? NOTE_RECEIVE_OFF_MESSAGE : NOTE_RECEIVE_ON_MESSAGE);
    },
    onError: alertApiError,
  });

  return (
    <HeaderIconButton
      icon={enabled ? BellIcon : BellSlashIcon}
      onPress={toggle.isPending ? undefined : () => toggle.mutate()}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const unreadCount = useChatUnreadCount();

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
                ? unreadCount > MAX_BADGE_COUNT
                  ? `${MAX_BADGE_COUNT}+`
                  : unreadCount
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
