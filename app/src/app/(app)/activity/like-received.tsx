import { useTranslation } from "react-i18next";

import { RelationListScreen } from "@/components/activity/RelationListScreen";
import { relationListKey } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const RECEIVED_LIKES_KEY = relationListKey("likes", "received");

export default function ReceivedLikeListScreen() {
  const { t } = useTranslation();

  return (
    <RelationListScreen
      title={t("list.likesReceived")}
      listKey={RECEIVED_LIKES_KEY}
      fetch={api.likes.received}
    />
  );
}
