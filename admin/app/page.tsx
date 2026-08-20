"use client";

import { useQuery } from "@tanstack/react-query";
import { AccessEnvironmentCard } from "@/components/dashboard/access-environment";
import { DauChart } from "@/components/dashboard/dau-chart";
import { DemographicsChart } from "@/components/dashboard/demographics-chart";
import { RecentReports } from "@/components/dashboard/recent-reports";
import { RecentSuspensions } from "@/components/dashboard/recent-suspensions";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/page-header";
import { QuerySection } from "@/components/query-section";
import {
  fetchAccessEnvironment,
  fetchActiveUsers,
  fetchDashboardSummary,
  fetchDemographics,
  fetchRecentActivity,
  fetchTrend,
} from "@/lib/api/dashboard";

export default function DashboardPage() {
  const summary = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
  });
  const trend = useQuery({
    queryKey: ["dashboard", "trend"],
    queryFn: fetchTrend,
  });
  const activeUsers = useQuery({
    queryKey: ["dashboard", "active-users"],
    queryFn: fetchActiveUsers,
  });
  const demographics = useQuery({
    queryKey: ["dashboard", "demographics"],
    queryFn: fetchDemographics,
  });
  const accessEnvironment = useQuery({
    queryKey: ["dashboard", "access-environment"],
    queryFn: fetchAccessEnvironment,
  });
  const recent = useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: fetchRecentActivity,
  });

  return (
    <>
      <PageHeader title="대시보드" description="운영 현황을 한눈에 봅니다." />
      <QuerySection
        isPending={summary.isPending}
        error={summary.error}
        skeletonClassName="h-24 w-full"
      >
        {summary.data && (
          <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
            <StatCard
              title="미처리 회원 신고"
              value={summary.data.pendingMemberReports}
              href="/reports/members"
            />
            <StatCard
              title="정지 중 회원"
              value={summary.data.suspendedMembers}
              href="/suspensions"
            />
            <StatCard
              title="오늘 가입"
              value={summary.data.todaySignups}
              href="/members"
            />
            <StatCard title="오늘 탈퇴" value={summary.data.todayWithdrawals} />
          </div>
        )}
      </QuerySection>
      <QuerySection
        isPending={activeUsers.isPending}
        error={activeUsers.error}
        skeletonClassName="h-24 w-full"
      >
        {activeUsers.data && (
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <StatCard title="DAU" value={activeUsers.data.dau} />
            <StatCard title="WAU" value={activeUsers.data.wau} />
            <StatCard title="MAU" value={activeUsers.data.mau} />
          </div>
        )}
      </QuerySection>
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <QuerySection
          isPending={trend.isPending}
          error={trend.error}
          skeletonClassName="h-96 w-full"
        >
          {trend.data && <TrendChart data={trend.data} />}
        </QuerySection>
        <QuerySection
          isPending={activeUsers.isPending}
          error={activeUsers.error}
          skeletonClassName="h-96 w-full"
        >
          {activeUsers.data && <DauChart data={activeUsers.data.trend} />}
        </QuerySection>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <QuerySection
          isPending={demographics.isPending}
          error={demographics.error}
          skeletonClassName="h-96 w-full"
        >
          {demographics.data && <DemographicsChart data={demographics.data} />}
        </QuerySection>
        <QuerySection
          isPending={accessEnvironment.isPending}
          error={accessEnvironment.error}
          skeletonClassName="h-96 w-full"
        >
          {accessEnvironment.data && (
            <AccessEnvironmentCard data={accessEnvironment.data} />
          )}
        </QuerySection>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <QuerySection
          isPending={recent.isPending}
          error={recent.error}
          skeletonClassName="h-72 w-full"
        >
          {recent.data && <RecentReports reports={recent.data.reports} />}
        </QuerySection>
        <QuerySection
          isPending={recent.isPending}
          error={recent.error}
          skeletonClassName="h-72 w-full"
        >
          {recent.data && (
            <RecentSuspensions suspensions={recent.data.suspensions} />
          )}
        </QuerySection>
      </div>
    </>
  );
}
