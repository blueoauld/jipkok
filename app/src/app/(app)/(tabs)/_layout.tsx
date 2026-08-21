import { Tabs } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { ChatCircleIcon } from "phosphor-react-native/src/icons/ChatCircle";
import { CheckSquareIcon } from "phosphor-react-native/src/icons/CheckSquare";
import { FireIcon } from "phosphor-react-native/src/icons/Fire";
import { GearIcon } from "phosphor-react-native/src/icons/Gear";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { TrophyIcon } from "phosphor-react-native/src/icons/Trophy";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, XStack } from "tamagui";

import { BellToggleButton } from "@/components/BellToggleButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";
import { formatUnreadCount } from "@/lib/chat";
import { useChatSelectionStore } from "@/lib/chat/store";
import {
  bottomBarHeight,
  PRESS_OPACITY,
  RETRO_BORDER_WIDTH,
} from "@/lib/design";
import { pushOnce } from "@/lib/router";
import { useAccentColor } from "@/lib/theme/accent";

const ICON_SIZE = 30;
const HEADER_EDGE_PADDING = 4;

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
    headerRight: () => <ChatHeaderRight />,
  },
  { name: "feed", title: "라운지", icon: FireIcon },
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

function ChatHeaderRight() {
  const startSelection = useChatSelectionStore((state) => state.start);

  return (
    <XStack items="center">
      <HeaderIconButton icon={CheckSquareIcon} onPress={startSelection} />
      <NoteReceiveButton />
    </XStack>
  );
}

function SelectionCancelButton() {
  const endSelection = useChatSelectionStore((state) => state.end);

  return <HeaderTextButton label="취소" onPress={endSelection} />;
}

function SelectAllButton() {
  const selectedCount = useChatSelectionStore((state) => state.selected.size);
  const roomCount = useChatSelectionStore((state) => state.roomIds.length);
  const selectAll = useChatSelectionStore((state) => state.selectAll);
  const clear = useChatSelectionStore((state) => state.clear);

  const all = roomCount > 0 && selectedCount >= roomCount;

  return (
    <HeaderTextButton
      label={all ? "전체 해제" : "전체 선택"}
      onPress={all ? clear : selectAll}
    />
  );
}

export default function TabsLayout() {
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
        tabBarStyle: {
          height: bottomBarHeight(insets.bottom),
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
                borderTopWidth: RETRO_BORDER_WIDTH,
                borderColor: theme.gray12.val,
              },
            ]}
          />
        ),
        // 래퍼를 늘리면 배지가 래퍼 끝에 붙어 아이패드처럼 넓은 칸에서 멀어진다.
        tabBarIconStyle: {
          width: ICON_SIZE,
          height: ICON_SIZE,
        },
      }}
    >
      {TABS.map(({ name, title, icon: Icon, headerLeft, headerRight }) => {
        const selecting = name === "chat" && chatSelecting;

        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: selecting ? `${selectedCount}개 선택` : title,
              headerLeft: selecting
                ? () => <SelectionCancelButton />
                : headerLeft,
              headerRight: selecting ? () => <SelectAllButton /> : headerRight,
              tabBarBadge:
                name === "chat" && unreadCount > 0
                  ? formatUnreadCount(unreadCount)
                  : undefined,
              tabBarBadgeStyle: {
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
