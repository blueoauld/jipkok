import { api } from "@/lib/api/client";
import type {
  AppleAdsAction,
  AppleAdsActionPage,
  AppleAdsAutomation,
  AppleAdsAutomationRun,
  AppleAdsCampaign,
  AppleAdsKeywordList,
  AppleAdsRecommendationList,
  AppleAdsReportStatus,
  AppleAdsSearchTermList,
  AppleAdsSyncResult,
  ApplyAppleAdsActionBody,
  UpdateAppleAdsAutomationBody,
} from "@/lib/types";

export type AppleAdsReportParams = {
  startDate: string;
  endDate: string;
  campaignId: string;
  source?: string;
};

const campaignIdOf = (campaignId: string) =>
  campaignId === "ALL" ? undefined : Number(campaignId);

export const fetchAppleAdsReportStatus = () =>
  api<AppleAdsReportStatus>("/api/admin/apple-ads/reports/status");

export const fetchAppleAdsCampaigns = () =>
  api<AppleAdsCampaign[]>("/api/admin/apple-ads/campaigns");

export const fetchAppleAdsKeywords = (params: AppleAdsReportParams) =>
  api<AppleAdsKeywordList>("/api/admin/apple-ads/keywords", {
    query: {
      startDate: params.startDate,
      endDate: params.endDate,
      campaignId: campaignIdOf(params.campaignId),
    },
  });

export const fetchAppleAdsSearchTerms = (params: AppleAdsReportParams) =>
  api<AppleAdsSearchTermList>("/api/admin/apple-ads/search-terms", {
    query: {
      startDate: params.startDate,
      endDate: params.endDate,
      campaignId: campaignIdOf(params.campaignId),
      source: params.source === "ALL" ? undefined : params.source,
    },
  });

export const fetchAppleAdsRecommendations = (params: AppleAdsReportParams) =>
  api<AppleAdsRecommendationList>("/api/admin/apple-ads/recommendations", {
    query: {
      startDate: params.startDate,
      endDate: params.endDate,
      campaignId: campaignIdOf(params.campaignId),
    },
  });

export const applyAppleAdsAction = (body: ApplyAppleAdsActionBody) =>
  api<AppleAdsAction>("/api/admin/apple-ads/actions", {
    method: "POST",
    body,
  });

export const revertAppleAdsAction = (actionId: number) =>
  api<AppleAdsAction>(`/api/admin/apple-ads/actions/${actionId}/revert`, {
    method: "POST",
  });

export const fetchAppleAdsActions = (page: number) =>
  api<AppleAdsActionPage>("/api/admin/apple-ads/actions", {
    query: { page },
  });

export const fetchAppleAdsAutomation = () =>
  api<AppleAdsAutomation>("/api/admin/apple-ads/automation");

export const updateAppleAdsAutomation = (body: UpdateAppleAdsAutomationBody) =>
  api<AppleAdsAutomation>("/api/admin/apple-ads/automation", {
    method: "PUT",
    body,
  });

export const runAppleAdsAutomation = () =>
  api<AppleAdsAutomationRun>("/api/admin/apple-ads/automation/run", {
    method: "POST",
  });

export const syncAppleAdsReports = (startDate: string, endDate: string) =>
  api<AppleAdsSyncResult>("/api/admin/apple-ads/reports/sync", {
    method: "POST",
    query: { startDate, endDate },
  });
