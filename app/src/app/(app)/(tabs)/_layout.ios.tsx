import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { DynamicColorIOS } from "react-native";

import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { formatUnreadCount } from "@/lib/chat";
import { useChatSelectionStore } from "@/lib/chat/store";
import { TDS_COLORS } from "@/tamagui.config";

// 시스템 탭 바의 유리는 뒤 내용에 따라 밝기가 바뀌므로 색을 라이트와 다크 두 벌로 넘긴다.
function dynamicColor(name: keyof typeof TDS_COLORS) {
  const [light, dark] = TDS_COLORS[name];

  return DynamicColorIOS({ light, dark });
}

const SELECTED_COLOR = dynamicColor("grey900");
// iOS 26 리퀴드 글래스 탭 바는 안 고른 탭을 시스템 색으로 그려 이 색은 18 이하에서만 보인다.
const UNSELECTED_COLOR = dynamicColor("grey400");
const BADGE_COLOR = dynamicColor("red500");

// iOS 시스템 탭 바다. 안드로이드는 _layout.tsx의 탭 바를 쓴다. 목록과 떠 있는 버튼은 탭 바가 덮는 만큼을
// useTabBarOverlay로 직접 비우므로 탭마다 자동 여백을 끈다. iOS 18 이하는 목록 끝에서 탭 바 배경을
// 지우는데, 목록이 탭 안 스택에 들어 있어 끝을 알아채지 못하므로 배경을 늘 둔다.
export default function TabsLayout() {
  const { t } = useTranslation();
  const unreadCount = useChatUnreadCount();
  // 채팅방을 고르는 동안에는 탭 바를 숨기고 그 자리에 고르기 버튼 줄이 온다.
  const chatSelecting = useChatSelectionStore((state) => state.active);

  return (
    <NativeTabs
      tintColor={SELECTED_COLOR}
      iconColor={{ default: UNSELECTED_COLOR, selected: SELECTED_COLOR }}
      labelStyle={{
        default: { color: UNSELECTED_COLOR },
        selected: { color: SELECTED_COLOR },
      }}
      badgeBackgroundColor={BADGE_COLOR}
      hidden={chatSelecting}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="main" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.main")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.chat")}</NativeTabs.Trigger.Label>
        {/* 글자를 넘기면 hidden을 무시하고 그 글자로 배지를 띄우므로, 안 읽은 게 없으면 글자를 비운다. */}
        <NativeTabs.Trigger.Badge hidden={unreadCount === 0}>
          {unreadCount > 0 ? formatUnreadCount(unreadCount) : undefined}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="feed" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: "flame", selected: "flame.fill" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.lounge")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="diary" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: "book", selected: "book.fill" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.diary")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="setting" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
        />
        <NativeTabs.Trigger.Label>{t("tabs.setting")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
