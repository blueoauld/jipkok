import type { components, paths } from "./schema";

type Schemas = components["schemas"];
type Paths = paths;

export type SignupRequest = Schemas["SignupRequest"];
export type LoginRequest = Schemas["LoginRequest"];
export type TokenResponse = Schemas["TokenResponse"];
export type ResetPasswordRequest = Schemas["ResetPasswordRequest"];
export type VerificationPurpose =
  Schemas["SendVerificationCodeRequest"]["purpose"];

export type MyProfileResponse = Schemas["MyProfileResponse"];
export type MemberSummaryResponse = Schemas["MemberSummaryResponse"];
export type MemberDetailResponse = Schemas["MemberDetailResponse"];
export type MemberListItemResponse = Schemas["MemberListItemResponse"];
export type MemberSort = NonNullable<
  NonNullable<Paths["/api/members"]["get"]["parameters"]["query"]>["sort"]
>;
export type Gender = MyProfileResponse["gender"];
export type SetupProfileRequest = Schemas["SetupProfileRequest"];
export type EditProfileRequest = Schemas["EditProfileRequest"];
export type UpdateCommentRequest = Schemas["UpdateCommentRequest"];
export type HeartbeatRequest = Schemas["HeartbeatRequest"];
export type PhotoUploadUrlResponse = Schemas["PhotoUploadUrlResponse"];
export type CreateProfilePhotoUploadUrlRequest =
  Schemas["CreateProfilePhotoUploadUrlRequest"];
export type PhotoVisibility = CreateProfilePhotoUploadUrlRequest["visibility"];
export type ProfilePhoto = Schemas["ProfilePhotoResponse"];
export type SuspensionResponse = Schemas["SuspensionResponse"];
export type RegisterDeviceTokenRequest = Schemas["RegisterDeviceTokenRequest"];
export type DevicePlatform = RegisterDeviceTokenRequest["platform"];
export type SuspensionReason = SuspensionResponse["reason"];
export type AppVersionResponse = Schemas["AppVersionResponse"];

export type ChatRoomResponse = Schemas["ChatRoomResponse"];
export type ChatRoomPage = Schemas["CursorResponseChatRoomResponse"];
export type ChatMessageResponse = Schemas["ChatMessageResponse"];
export type ChatMessageType = ChatMessageResponse["type"];
export type ChatMessagePage = Schemas["CursorResponseChatMessageResponse"];
export type SendMessageRequest = Schemas["SendMessageRequest"];
export type ReplyMessageResponse = Schemas["ReplyMessageResponse"];
export type ChatVideoUrlResponse = Schemas["ChatVideoUrlResponse"];
export type ChatReactionResponse = Schemas["ChatReactionResponse"];
export type ChatReactionsResponse = Schemas["ChatReactionsResponse"];
export type ChatReactionType = ChatReactionResponse["type"];

export type CreateReportRequest = Schemas["CreateReportRequest"];
export type ReportReason = CreateReportRequest["reason"];

export type FeedSort = "LATEST" | "OLDEST";
export type FeedPostResponse = Schemas["FeedPostResponse"];
export type CreateFeedPostRequest = Schemas["CreateFeedPostRequest"];
export type FeedPostPage = Schemas["CursorResponseFeedPostResponse"];
export type PointRewardResponse = Schemas["PointRewardResponse"];
export type PointHistoryResponse = Schemas["PointHistoryResponse"];
export type PointType = PointHistoryResponse["type"];

export type MemberSummaryPage = Schemas["CursorResponseMemberSummaryResponse"];
export type MemberListPage = Schemas["ScrollResponseMemberListItemResponse"];
export type MemberSearchPage = Schemas["ScrollResponseMemberSummaryResponse"];
export type ProfileViewPage = Schemas["ScrollResponseProfileViewResponse"];
export type PointHistoryPage = Schemas["CursorResponsePointHistoryResponse"];
