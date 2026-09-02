import { useTranslation } from "react-i18next";

import { RelationListScreen } from "@/components/activity/RelationListScreen";
import { relationListKey } from "@/hooks/useMemberList";
import { api } from "@/lib/api";

const GRANTED_SECRET_PHOTOS_KEY = relationListKey("secretPhotos", "granted");

export default function SecretPhotoListScreen() {
  const { t } = useTranslation();

  return (
    <RelationListScreen
      title={t("list.secretPhotos")}
      listKey={GRANTED_SECRET_PHOTOS_KEY}
      fetch={api.secretPhotos.granted}
      remove={api.secretPhotos.remove}
    />
  );
}
