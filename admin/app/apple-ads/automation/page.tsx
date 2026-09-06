import { AutomationSettings } from "@/components/apple-ads/automation-settings";
import { PageHeader } from "@/components/page-header";

export default function AppleAdsAutomationPage() {
  return (
    <>
      <PageHeader
        title="자동 실행"
        description="추천을 매일 자동으로 적용할지와 그 범위를 정합니다."
      />
      <AutomationSettings />
    </>
  );
}
