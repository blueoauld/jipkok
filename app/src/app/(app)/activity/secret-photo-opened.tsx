import { useTranslation } from "react-i18next";

import { RelationListScreen } from "@/components/activity/RelationListScreen";
import { relationListKey } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const RECEIVED_SECRET_PHOTOS_KEY = relationListKey("secretPhotos", "received");

export default function OpenedSecretPhotoListScreen() {
  const { t } = useTranslation();

  return (
    <RelationListScreen
      title={t("list.secretPhotosOpened")}
      listKey={RECEIVED_SECRET_PHOTOS_KEY}
      fetch={api.secretPhotos.received}
    />
  );
}
