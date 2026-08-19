import { AccessEnvironmentCard } from "@/components/dashboard/access-environment";
import { DauChart } from "@/components/dashboard/dau-chart";
import { DemographicsChart } from "@/components/dashboard/demographics-chart";
import { RecentReports } from "@/components/dashboard/recent-reports";
import { RecentSuspensions } from "@/components/dashboard/recent-suspensions";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/page-header";
import {
  accessEnvironment,
  activeUsers,
  dashboardSummary,
  dauTrend,
  demographics,
  recentReports,
  recentSuspensions,
  trend,
} from "@/lib/mock/dashboard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="대시보드" description="운영 현황을 한눈에 봅니다." />
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="미처리 회원 신고"
          value={dashboardSummary.pendingMemberReports}
          href="/reports/members"
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
        <StatCard title="오늘 탈퇴" value={dashboardSummary.todayWithdrawals} />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="DAU" value={activeUsers.dau} />
        <StatCard title="WAU" value={activeUsers.wau} />
        <StatCard title="MAU" value={activeUsers.mau} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <TrendChart data={trend} />
        <DauChart data={dauTrend} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <DemographicsChart data={demographics} />
        <AccessEnvironmentCard data={accessEnvironment} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <RecentReports reports={recentReports} />
        <RecentSuspensions suspensions={recentSuspensions} />
      </div>
    </>
  );
}
