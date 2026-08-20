import { api } from "@/lib/api/client";
import type {
  AccessEnvironment,
  ActiveUsers,
  DashboardSummary,
  Demographics,
  RecentActivity,
  TrendPoint,
} from "@/lib/types";

export const fetchDashboardSummary = () =>
  api<DashboardSummary>("/api/admin/dashboard/summary");

export const fetchTrend = () => api<TrendPoint[]>("/api/admin/dashboard/trend");

export const fetchActiveUsers = () =>
  api<ActiveUsers>("/api/admin/dashboard/active-users");

export const fetchDemographics = () =>
  api<Demographics>("/api/admin/dashboard/demographics");

export const fetchAccessEnvironment = () =>
  api<AccessEnvironment>("/api/admin/dashboard/access-environment");

export const fetchRecentActivity = () =>
  api<RecentActivity>("/api/admin/dashboard/recent");
