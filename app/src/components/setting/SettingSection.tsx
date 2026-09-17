import { useTranslation } from "react-i18next";
import { Spinner, Text, YStack } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { ListRow, ListRowIcon } from "@/components/ui/ListRow";
import {
  PROFILE_VIEW_HREF,
  type SettingAction,
  type SettingItem,
} from "@/lib/setting/menu";

function SettingRow({
  item,
  pending,
  divider,
  hasNew,
  status,
  onPress,
}: {
  item: SettingItem;
  pending: boolean;
  divider: boolean;
  hasNew: boolean;
  status?: string;
  onPress?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ListRow
      left={<ListRowIcon icon={item.icon} />}
      right={
        <>
          {hasNew && <Badge>N</Badge>}
          {status && !pending && (
            <Text fontSize="$2" color="$grey600">
              {status}
            </Text>
          )}
          {pending && <Spinner size="small" />}
        </>
      }
      withArrow={item.href !== undefined || item.url !== undefined}
      divider={divider}
      onPress={onPress}
    >
      <Text numberOfLines={1} fontSize="$4" fontWeight="500" color="$grey700">
        {t(item.labelKey)}
      </Text>
    </ListRow>
  );
}

export function SettingSection({
  items,
  pendingAction,
  profileViewCount,
  appLockEnabled,
  onItemPress,
}: {
  items: SettingItem[];
  pendingAction: SettingAction | null;
  profileViewCount: number;
  appLockEnabled: boolean;
  onItemPress: (item: SettingItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <YStack>
      {items.map((item, index) => (
        <SettingRow
          key={item.labelKey}
          item={item}
          pending={item.action === pendingAction}
          divider={index < items.length - 1}
          hasNew={item.href === PROFILE_VIEW_HREF && profileViewCount > 0}
          status={
            item.action === "appLock"
              ? t(appLockEnabled ? "setting.on" : "setting.off")
              : undefined
          }
          onPress={
            item.href || item.url || item.action
              ? () => onItemPress(item)
              : undefined
          }
        />
      ))}
    </YStack>
  );
}
