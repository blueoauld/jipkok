import { BellToggleButton } from "@/components/BellToggleButton";
import { useMyProfile } from "@/hooks/useMyProfile";
import { api } from "@/lib/api";

const ON_MESSAGE = "이제 피드 알림을 받을 수 있습니다.";
const OFF_MESSAGE = "이제 피드 알림을 받지 않습니다.";

export function FeedNotificationButton() {
  const { data: profile } = useMyProfile();

  return (
    <BellToggleButton
      enabled={profile?.feedNotificationEnabled ?? true}
      field="feedNotificationEnabled"
      update={api.members.updateFeedNotification}
      onMessage={ON_MESSAGE}
      offMessage={OFF_MESSAGE}
    />
  );
}
