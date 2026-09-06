import type { components } from "@/lib/api/schema";

type Schemas = components["schemas"];

export type DashboardSummary = Schemas["DashboardSummaryResponse"];
export type TrendPoint = Schemas["TrendPointResponse"];
export type ActiveUsers = Schemas["ActiveUsersResponse"];
export type DauPoint = Schemas["DauPointResponse"];
export type Demographics = Schemas["DemographicsResponse"];
export type AccessEnvironment = Schemas["AccessEnvironmentResponse"];
export type RecentActivity = Schemas["RecentActivityResponse"];
export type RecentReport = Schemas["RecentReportResponse"];
export type RecentSuspension = Schemas["RecentSuspensionResponse"];
export type MemberReport = Schemas["AdminReportResponse"];
export type MemberReportPage = Schemas["AdminReportPageResponse"];
export type MemberReportDetail = Schemas["AdminReportDetailResponse"];
export type ChatMessageSnapshot = Schemas["AdminChatMessageResponse"];
export type MemberSummary = Schemas["AdminMemberResponse"];
export type MemberPage = Schemas["AdminMemberPageResponse"];
export type MemberDetail = Schemas["AdminMemberDetailResponse"];
export type Suspension = Schemas["AdminSuspensionResponse"];
export type SuspensionStatus = Suspension["status"];
export type SuspensionPage = Schemas["AdminSuspensionPageResponse"];
export type FeedReport = Schemas["AdminFeedReportResponse"];
export type FeedReportPage = Schemas["AdminFeedReportPageResponse"];
export type WorryReport = Schemas["AdminWorryPostReportResponse"];
export type WorryReportPage = Schemas["AdminWorryPostReportPageResponse"];
export type WorryCommentReport = Schemas["AdminWorryCommentReportResponse"];
export type WorryCommentReportPage =
  Schemas["AdminWorryCommentReportPageResponse"];
export type SmsMessage = Schemas["AdminMessageResponse"];
export type SmsMessagePage = Schemas["AdminMessagePageResponse"];
export type SmsMessageStatus = NonNullable<SmsMessage["status"]>;
export type AdminAction = Schemas["AdminActionResponse"];
export type AppleAdsCampaign = Schemas["AdminAppleAdsCampaignResponse"];
export type AppleAdsMetrics = Schemas["AdminAppleAdsMetricsResponse"];
export type AppleAdsKeyword = Schemas["AdminAppleAdsKeywordResponse"];
export type AppleAdsKeywordList = Schemas["AdminAppleAdsKeywordListResponse"];
export type AppleAdsSearchTerm = Schemas["AdminAppleAdsSearchTermResponse"];
export type AppleAdsSearchTermList =
  Schemas["AdminAppleAdsSearchTermListResponse"];
export type AppleAdsSyncResult = Schemas["AdminAppleAdsSyncResponse"];
export type AppleAdsRecommendation =
  Schemas["AdminAppleAdsRecommendationResponse"];
export type AppleAdsRecommendationList =
  Schemas["AdminAppleAdsRecommendationListResponse"];
export type AppleAdsRecommendationType = AppleAdsRecommendation["type"];
export type AdminActionPage = Schemas["AdminActionPageResponse"];
export type ReportType = MemberReport["type"];
export type ReportReason = MemberReport["reason"];
export type SuspensionType = Suspension["type"];
export type SuspensionReason = Suspension["reason"];
export type Gender = MemberSummary["gender"];
export type ProfileTarget = NonNullable<
  Schemas["ResetProfileRequest"]["target"]
>;
export type DevicePlatform = Schemas["VersionCountResponse"]["platform"];
export type AdminActionType = AdminAction["action"];
