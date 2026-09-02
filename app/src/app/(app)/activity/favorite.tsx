import { useTranslation } from "react-i18next";

import { RelationListScreen } from "@/components/activity/RelationListScreen";
import { relationListKey } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const FAVORITES_KEY = relationListKey("favorites", "mine");

export default function FavoriteListScreen() {
  const { t } = useTranslation();

  return (
    <RelationListScreen
      title={t("list.favorites")}
      listKey={FAVORITES_KEY}
      fetch={api.favorites.mine}
      remove={api.favorites.remove}
    />
  );
}
