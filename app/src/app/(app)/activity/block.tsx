import { useTranslation } from "react-i18next";

import { RelationListScreen } from "@/components/activity/RelationListScreen";
import { relationListKey } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const BLOCKS_KEY = relationListKey("blocks", "mine");

export default function BlockListScreen() {
  const { t } = useTranslation();

  return (
    <RelationListScreen
      title={t("list.blocks")}
      listKey={BLOCKS_KEY}
      fetch={api.blocks.mine}
      remove={api.blocks.remove}
    />
  );
}
