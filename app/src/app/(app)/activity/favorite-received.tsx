import { useTranslation } from "react-i18next";

import { RelationListScreen } from "@/components/activity/RelationListScreen";
import { relationListKey } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const RECEIVED_FAVORITES_KEY = relationListKey("favorites", "received");

export default function ReceivedFavoriteListScreen() {
  const { t } = useTranslation();

  return (
    <RelationListScreen
      title={t("list.favoritesReceived")}
      listKey={RECEIVED_FAVORITES_KEY}
      fetch={api.favorites.received}
    />
  );
}
