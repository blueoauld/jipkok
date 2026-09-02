import { useTranslation } from "react-i18next";

import { RelationListScreen } from "@/components/activity/RelationListScreen";
import { relationListKey } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const LIKES_KEY = relationListKey("likes", "mine");

export default function LikeListScreen() {
  const { t } = useTranslation();

  return (
    <RelationListScreen
      title={t("list.likes")}
      listKey={LIKES_KEY}
      fetch={api.likes.mine}
      remove={api.likes.remove}
    />
  );
}
