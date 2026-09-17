import { CheckSquareIcon } from "phosphor-react-native/src/icons/CheckSquare";
import { FunnelSimpleIcon } from "phosphor-react-native/src/icons/FunnelSimple";
import { SquareIcon } from "phosphor-react-native/src/icons/Square";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useTranslation } from "react-i18next";

import { BellToggleButton } from "@/components/BellToggleButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { HeaderIconGroup } from "@/components/HeaderIconGroup";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";
import { useChatSelectionStore } from "@/lib/chat/store";

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

export function ChatHeaderRight() {
  const { t } = useTranslation();
  const startSelection = useChatSelectionStore((state) => state.start);

  return (
    <HeaderIconGroup>
      <HeaderIconButton
        icon={FunnelSimpleIcon}
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

  return (
    <HeaderIconButton
      icon={XIcon}
      label={t("tabs.cancel")}
      onPress={endSelection}
    />
  );
}

export function SelectAllButton() {
  const { t } = useTranslation();
  const selectedCount = useChatSelectionStore((state) => state.selected.size);
  const roomCount = useChatSelectionStore((state) => state.roomIds.length);
  const selectAll = useChatSelectionStore((state) => state.selectAll);
  const clear = useChatSelectionStore((state) => state.clear);

  const all = roomCount > 0 && selectedCount >= roomCount;

  return (
    <HeaderIconButton
      icon={all ? SquareIcon : CheckSquareIcon}
      label={all ? t("tabs.deselectAll") : t("tabs.selectAll")}
      onPress={all ? clear : selectAll}
    />
  );
}
