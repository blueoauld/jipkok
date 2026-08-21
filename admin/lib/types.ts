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
export type ReportType = "PROFILE" | "CHAT";

export type ReportReason =
  | "OBSCENITY"
  | "MINOR"
  | "MONEY_TRANSACTION"
  | "ABUSE"
  | "IMPERSONATION"
  | "ETC";

export type SuspensionType = "SECRET_PHOTO" | "PROFILE_EDIT" | "SERVICE";

export type SuspensionReason = "SCREEN_CAPTURE" | ReportReason;

export type MemberReportType = ReportType;

export type Gender = "MALE" | "FEMALE";

export type ProfileTarget =
  "NICKNAME" | "COMMENT" | "BIO" | "PUBLIC_PHOTO" | "SECRET_PHOTO";

export type DevicePlatform = "IOS" | "ANDROID";
