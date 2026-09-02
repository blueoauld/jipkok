import { CheckSquareIcon } from "phosphor-react-native/src/icons/CheckSquare";
import { useTranslation } from "react-i18next";
import { Text, XStack } from "tamagui";

import { BellToggleButton } from "@/components/BellToggleButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { Glass } from "@/components/ui/Glass";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";
import { useChatSelectionStore } from "@/lib/chat/store";
import { HEADER_GLASS_SIZE, PRESS_OPACITY } from "@/lib/design";
import { GLASS_ENABLED } from "@/lib/glass";

// 유리 캡슐 안에서 글자가 벽에 붙지 않을 만큼이다.
const HEADER_TEXT_PADDING = 14;

function NoteReceiveButton() {
  const { t } = useTranslation();
  const { data: profile } = useMyProfile();

  return (
    <BellToggleButton
      label={t("a11y.noteReceive")}
      enabled={profile?.noteReceiveEnabled ?? true}
      field="noteReceiveEnabled"
      update={api.members.updateNoteReceive}
      onMessage={t("tabs.noteReceiveOn")}
      offMessage={t("tabs.noteReceiveOff")}
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
  const text = (
    <Text fontSize="$4" fontWeight="600">
      {label}
    </Text>
  );

  return (
    <XStack
      items="center"
      justify="center"
      px={GLASS_ENABLED ? 0 : "$3"}
      py={GLASS_ENABLED ? 0 : "$2"}
      pressStyle={{ opacity: PRESS_OPACITY }}
      accessibilityRole="button"
      onPress={onPress}
    >
      {GLASS_ENABLED ? (
        <Glass
          style={{
            height: HEADER_GLASS_SIZE,
            borderRadius: HEADER_GLASS_SIZE / 2,
            paddingHorizontal: HEADER_TEXT_PADDING,
            alignItems: "center",
            justifyContent: "center",
          }}
          isInteractive
        >
          {text}
        </Glass>
      ) : (
        text
      )}
    </XStack>
  );
}

export function ChatHeaderRight() {
  const { t } = useTranslation();
  const startSelection = useChatSelectionStore((state) => state.start);

  return (
    <HeaderIconGroup>
      <HeaderIconButton
        icon={CheckSquareIcon}
        label={t("a11y.selectRooms")}
        onPress={startSelection}
      />
      <NoteReceiveButton />
    </HeaderIconGroup>
  );
}

export function SelectionCancelButton() {
  const { t } = useTranslation();
  const endSelection = useChatSelectionStore((state) => state.end);

  return <HeaderTextButton label={t("tabs.cancel")} onPress={endSelection} />;
}

export function SelectAllButton() {
  const { t } = useTranslation();
  const selectedCount = useChatSelectionStore((state) => state.selected.size);
  const roomCount = useChatSelectionStore((state) => state.roomIds.length);
  const selectAll = useChatSelectionStore((state) => state.selectAll);
  const clear = useChatSelectionStore((state) => state.clear);

  const all = roomCount > 0 && selectedCount >= roomCount;

  return (
    <HeaderTextButton
      label={all ? t("tabs.deselectAll") : t("tabs.selectAll")}
      onPress={all ? clear : selectAll}
    />
  );
}
