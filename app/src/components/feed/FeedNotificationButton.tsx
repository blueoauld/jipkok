import { useTranslation } from "react-i18next";

import { BellToggleButton } from "@/components/BellToggleButton";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";

export function FeedNotificationButton() {
  const { t } = useTranslation();
  const { data: profile } = useMyProfile();

  return (
    <BellToggleButton
      enabled={profile?.feedNotificationEnabled ?? true}
      field="feedNotificationEnabled"
      update={api.members.updateFeedNotification}
      onMessage={t("feed.notificationOn")}
      offMessage={t("feed.notificationOff")}
    />
  );
}
