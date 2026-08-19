import { RecentReports } from "@/components/dashboard/recent-reports";
import { RecentSuspensions } from "@/components/dashboard/recent-suspensions";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/page-header";
import {
  dashboardSummary,
  recentReports,
  recentSuspensions,
  trend,
} from "@/lib/mock/dashboard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="대시보드" description="운영 현황을 한눈에 봅니다." />
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="미처리 회원 신고"
          value={dashboardSummary.pendingMemberReports}
          href="/reports/members"
        />
        <StatCard
          title="미처리 피드 신고"
          value={dashboardSummary.pendingFeedReports}
          href="/reports/feeds"
        />
        <StatCard
          title="정지 중 회원"
          value={dashboardSummary.suspendedMembers}
          href="/suspensions"
        />
        <StatCard
          title="오늘 가입"
          value={dashboardSummary.todaySignups}
          href="/members"
        />
      </div>
      <TrendChart data={trend} />
      <div className="grid grid-cols-2 gap-4">
        <RecentReports reports={recentReports} />
        <RecentSuspensions suspensions={recentSuspensions} />
      </div>
    </>
  );
}
