import type { components, paths } from "./schema";

type Schemas = components["schemas"];
type Paths = paths;

export type SignupRequest = Schemas["SignupRequest"];
export type SignupResponse = Schemas["SignupResponse"];
export type LoginRequest = Schemas["LoginRequest"];
export type TokenResponse = Schemas["TokenResponse"];
export type ReissueRequest = Schemas["ReissueRequest"];

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
export type UpdateNoteReceiveRequest = Schemas["UpdateNoteReceiveRequest"];
export type UpdateFeedNotificationRequest =
  Schemas["UpdateFeedNotificationRequest"];
export type HeartbeatRequest = Schemas["HeartbeatRequest"];
export type PhotoUploadUrlResponse = Schemas["PhotoUploadUrlResponse"];
export type CreatePhotoUploadUrlRequest =
  Schemas["CreatePhotoUploadUrlRequest"];
export type PhotoVisibility = CreatePhotoUploadUrlRequest["visibility"];
export type ProfilePhoto = Schemas["ProfilePhotoResponse"];
export type SuspensionResponse = Schemas["SuspensionResponse"];
export type RegisterDeviceTokenRequest = Schemas["RegisterDeviceTokenRequest"];
export type DevicePlatform = RegisterDeviceTokenRequest["platform"];
export type SuspensionType = SuspensionResponse["type"];
export type SuspensionReason = SuspensionResponse["reason"];

export type ChatRoomResponse = Schemas["ChatRoomResponse"];
export type ChatMessageResponse = Schemas["ChatMessageResponse"];
export type ChatMessagePage = Schemas["CursorResponseChatMessageResponse"];
export type SendMessageRequest = Schemas["SendMessageRequest"];
export type ReplyMessageResponse = Schemas["ReplyMessageResponse"];
export type MarkReadRequest = Schemas["MarkReadRequest"];
export type ChatRoomPage = Schemas["CursorResponseChatRoomResponse"];
export type SendNoteRequest = Schemas["SendNoteRequest"];
export type SendNoteResponse = Schemas["SendNoteResponse"];

export type CreateReportRequest = Schemas["CreateReportRequest"];
export type ReportReason = CreateReportRequest["reason"];

export type FeedPostResponse = Schemas["FeedPostResponse"];
export type CreateFeedPostRequest = Schemas["CreateFeedPostRequest"];
export type FeedPhotoUploadUrlResponse = Schemas["FeedPhotoUploadUrlResponse"];
export type FeedPostPage = Schemas["CursorResponseFeedPostResponse"];
export type PointRewardResponse = Schemas["PointRewardResponse"];
export type AttendanceResponse = Schemas["AttendanceResponse"];
export type PointHistoryResponse = Schemas["PointHistoryResponse"];
export type PointType = PointHistoryResponse["type"];

export type MemberSummaryPage = Schemas["CursorResponseMemberSummaryResponse"];
export type MemberListPage = Schemas["ScrollResponseMemberListItemResponse"];
export type MemberSearchPage = Schemas["ScrollResponseMemberSummaryResponse"];
export type PointHistoryPage = Schemas["CursorResponsePointHistoryResponse"];

export type CursorPage<T> = {
  items: T[];
  nextCursor?: number;
};
