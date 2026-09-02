import { useTranslation } from "react-i18next";
import { Spinner, Text, useTheme, YStack } from "tamagui";

import { RetroBadge } from "@/components/ui/RetroBadge";
import { RetroListPanel, RetroListRow } from "@/components/ui/RetroListPanel";
import {
  PROFILE_VIEW_HREF,
  type SettingAction,
  type SettingItem,
} from "@/lib/setting/menu";

const ICON_SIZE = 22;

function SettingRow({
  item,
  pending,
  divider,
  hasNew,
  onPress,
}: {
  item: SettingItem;
  pending: boolean;
  divider: boolean;
  hasNew: boolean;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { labelKey, icon: Icon } = item;

  return (
    <RetroListRow divider={divider} gap="$3" onPress={onPress}>
      <Icon size={ICON_SIZE} color={theme.color12.val} />
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {t(labelKey)}
      </Text>
      {hasNew && <RetroBadge>N</RetroBadge>}
      {pending && <Spinner size="small" />}
    </RetroListRow>
  );
}

export function SettingSection({
  items,
  pendingAction,
  profileViewCount,
  onItemPress,
}: {
  items: SettingItem[];
  pendingAction: SettingAction | null;
  profileViewCount: number;
  onItemPress: (item: SettingItem) => void;
}) {
  return (
    <YStack mx="$4">
      <RetroListPanel>
        {items.map((item, index) => (
          <SettingRow
            key={item.labelKey}
            item={item}
            pending={item.action === pendingAction}
            divider={index < items.length - 1}
            hasNew={item.href === PROFILE_VIEW_HREF && profileViewCount > 0}
            onPress={
              item.href || item.url || item.action
                ? () => onItemPress(item)
                : undefined
            }
          />
        ))}
      </RetroListPanel>
    </YStack>
  );
}
