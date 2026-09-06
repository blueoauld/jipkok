import { Suspense } from "react";
import { MonitoringGrid } from "@/components/monitoring/monitoring-grid";
import { PageHeader } from "@/components/page-header";

export default function MonitoringPage() {
  return (
    <>
      <PageHeader
        title="모니터링"
        description="CloudWatch 대시보드의 지표 위젯을 그대로 보여줍니다."
      />
      <Suspense>
        <MonitoringGrid />
      </Suspense>
    </>
  );
}
