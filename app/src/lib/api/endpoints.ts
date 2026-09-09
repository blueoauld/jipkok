import { DEVICE_NAME, DEVICE_PLATFORM } from "@/lib/device";
import { toE164 } from "@/lib/phone";

import { request } from "./client";
import { clearTokens, getRefreshToken, saveTokens } from "./tokens";
import type {
  AppVersionResponse,
  AttendanceDaysResponse,
  ChatMessagePage,
  ChatMessageResponse,
  ChatReactionsResponse,
  ChatReactionType,
  ChatRoomPage,
  ChatRoomResponse,
  ChatVideoUrlResponse,
  ContactBlockRequest,
  ContactBlockResponse,
  CreateFeedPostRequest,
  CreateProfilePhotoUploadUrlRequest,
  CreateReportRequest,
  DevicePlatform,
  DiaryResponse,
  EditProfileRequest,
  FeedPostPage,
  FeedSort,
  Gender,
  HeartbeatRequest,
  LoginRequest,
  MemberDetailResponse,
  MemberListPage,
  MemberLocale,
  MemberSearchPage,
  MemberSort,
  MemberSummaryPage,
  MyProfileResponse,
  PhotoUploadUrlResponse,
  PointHistoryPage,
  PointRewardResponse,
  ProfileViewPage,
  ResetPasswordRequest,
  SendMessageRequest,
  SetupProfileRequest,
  SignupRequest,
  TokenResponse,
  TranslationResponse,
  TranslationSource,
  UpdateCommentRequest,
  VerificationPurpose,
  WorryCategory,
  WorryCommentPage,
  WorryPostPage,
  WorryPostResponse,
  WorrySort,
  WriteDiaryRequest,
} from "./types";

type CursorParams = { cursor?: number; size?: number };

type ChatRoomListParams = CursorParams & { unreadOnly?: boolean };

type ChatRoomSearchParams = CursorParams & { keyword: string };

type ScrollParams = { cursor?: string; size?: number };

type HeartbeatLocation = Omit<HeartbeatRequest, "platform" | "deviceName">;

type FeedListParams = {
  gender?: Gender;
  sort?: FeedSort;
  date?: string;
  cursor?: number;
  size?: number;
};

type WorryListParams = CursorParams & {
  sort?: WorrySort;
  category?: WorryCategory;
};

type WorrySearchParams = CursorParams & { keyword: string };

type MemberRankingParams = {
  gender?: Gender;
  cursor?: string;
  size?: number;
};

type MemberSearchParams = {
  keyword: string;
  cursor?: string;
  size?: number;
};

type MemberListParams = {
  sort?: MemberSort;
  gender?: Gender;
  minAge?: number;
  maxAge?: number;
  cursor?: string;
  size?: number;
};

export const auth = {
  sendVerificationCode: (phoneNumber: string, purpose: VerificationPurpose) =>
    request<void>("/api/auth/verification-codes", {
      method: "POST",
      body: { phoneNumber: toE164(phoneNumber), purpose },
      auth: false,
    }),

  resetPassword: (body: ResetPasswordRequest) =>
    request<void>("/api/auth/password", {
      method: "POST",
      body: { ...body, phoneNumber: toE164(body.phoneNumber) },
      auth: false,
    }),

  login: async (body: LoginRequest) => {
    const tokens = await request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: { ...body, phoneNumber: toE164(body.phoneNumber) },
      auth: false,
    });
    await saveTokens(tokens);

    return tokens;
  },

  logout: async () => {
    const refreshToken = await getRefreshToken();

    // 서버 호출이 실패해도 기기에서는 로그아웃해야 하므로 오류를 삼킨다.
    if (refreshToken) {
      await request<void>("/api/auth/logout", {
        method: "POST",
        body: { refreshToken },
        auth: false,
      }).catch(() => undefined);
    }

    await clearTokens();
  },
};

export const members = {
  signup: async (body: SignupRequest) => {
    const response = await request<TokenResponse>("/api/members", {
      method: "POST",
      body: { ...body, phoneNumber: toE164(body.phoneNumber) },
      auth: false,
    });
    await saveTokens(response);

    return response;
  },

  list: (params: MemberListParams = {}) =>
    request<MemberListPage>("/api/members", { query: params }),

  ranking: (params: MemberRankingParams = {}) =>
    request<MemberListPage>("/api/members/ranking", { query: params }),

  search: (params: MemberSearchParams) =>
    request<MemberSearchPage>("/api/members/search", { query: params }),

  detail: (memberId: number) =>
    request<MemberDetailResponse>(`/api/members/${memberId}`),

  myProfile: () => request<MyProfileResponse>("/api/members/me"),

  setupProfile: (body: SetupProfileRequest) =>
    request<void>("/api/members/me/profile", { method: "PATCH", body }),

  editProfile: (body: EditProfileRequest) =>
    request<void>("/api/members/me/profile", { method: "PUT", body }),

  updateNoteReceive: (enabled: boolean) =>
    request<void>("/api/members/me/note-receive", {
      method: "PUT",
      body: { enabled },
    }),

  updateLocale: (locale: MemberLocale) =>
    request<void>("/api/members/me/locale", {
      method: "PUT",
      body: { locale },
    }),

  sendNote: (memberId: number, content: string) =>
    request<void>(`/api/members/${memberId}/notes`, {
      method: "POST",
      body: { content },
    }),

  updateMemo: (memberId: number, content: string) =>
    request<void>(`/api/members/${memberId}/memo`, {
      method: "PUT",
      body: { content },
    }),

  updateFeedNotification: (enabled: boolean) =>
    request<void>("/api/members/me/feed-notification", {
      method: "PUT",
      body: { enabled },
    }),

  updateComment: (body: UpdateCommentRequest) =>
    request<void>("/api/members/me/comment", { method: "PUT", body }),

  heartbeat: (location: HeartbeatLocation = {}) =>
    request<PointRewardResponse>("/api/members/me/heartbeat", {
      method: "POST",
      body: {
        ...location,
        platform: DEVICE_PLATFORM,
        deviceName: DEVICE_NAME,
      },
    }),

  withdraw: async () => {
    await request<void>("/api/members/me", { method: "DELETE" });
    await clearTokens();
  },

  createPhotoUploadUrl: (body: CreateProfilePhotoUploadUrlRequest) =>
    request<PhotoUploadUrlResponse>("/api/members/me/photos/upload-url", {
      method: "POST",
      body,
    }),
};

function relation(name: string) {
  return {
    add: (memberId: number) =>
      request<void>(`/api/members/${memberId}/${name}`, { method: "POST" }),

    remove: (memberId: number) =>
      request<void>(`/api/members/${memberId}/${name}`, { method: "DELETE" }),
  };
}

export const likes = {
  ...relation("likes"),

  mine: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/likes", { query: params }),

  received: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/likes/received", {
      query: params,
    }),
};

export const favorites = {
  ...relation("favorites"),

  mine: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/favorites", { query: params }),

  received: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/favorites/received", {
      query: params,
    }),
};

export const secretPhotos = {
  urls: (memberId: number) =>
    request<string[]>(`/api/members/${memberId}/secret-photos/urls`),

  ...relation("secret-photos"),

  granted: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/secret-photos/granted", {
      query: params,
    }),

  received: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/secret-photos/received", {
      query: params,
    }),
};

export const app = {
  latestVersion: () =>
    request<AppVersionResponse>("/api/app/version", {
      query: { platform: DEVICE_PLATFORM },
    }),
};

export const profileViews = {
  received: (params: ScrollParams = {}) =>
    request<ProfileViewPage>("/api/members/me/profile-views", {
      query: params,
    }),

  newCount: () => request<number>("/api/members/me/profile-views/new-count"),

  markSeen: () =>
    request<void>("/api/members/me/profile-views/seen", { method: "POST" }),
};

export const blocks = {
  ...relation("blocks"),

  mine: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/blocks", { query: params }),
};

export const contactBlocks = {
  list: () => request<ContactBlockResponse[]>("/api/members/me/contact-blocks"),

  add: (body: ContactBlockRequest) =>
    request<void>("/api/members/me/contact-blocks", { method: "POST", body }),

  remove: (contactBlockId: number) =>
    request<void>(`/api/members/me/contact-blocks/${contactBlockId}`, {
      method: "DELETE",
    }),
};

export const diaries = {
  list: (month: string) =>
    request<DiaryResponse[]>("/api/diaries", { query: { month } }),

  createAttachmentUploadUrl: (contentType: string) =>
    request<PhotoUploadUrlResponse>("/api/diaries/attachments/upload-url", {
      method: "POST",
      body: { contentType },
    }),

  write: (entryDate: string, body: WriteDiaryRequest) =>
    request<void>(`/api/diaries/${entryDate}`, { method: "PUT", body }),

  remove: (entryDate: string) =>
    request<void>(`/api/diaries/${entryDate}`, { method: "DELETE" }),
};

export const points = {
  balance: () => request<number>("/api/points/me"),

  histories: (params: CursorParams = {}) =>
    request<PointHistoryPage>("/api/points/me/histories", { query: params }),
};

export const attendances = {
  checkIn: () =>
    request<PointRewardResponse>("/api/attendances", { method: "POST" }),

  days: () => request<AttendanceDaysResponse>("/api/attendances/me/days"),
};

export const feeds = {
  list: (params: FeedListParams = {}) =>
    request<FeedPostPage>("/api/feeds", { query: params }),

  create: (body: CreateFeedPostRequest) =>
    request<void>("/api/feeds", { method: "POST", body }),

  like: (postId: number) =>
    request<void>(`/api/feeds/${postId}/likes`, { method: "POST" }),

  cancelLike: (postId: number) =>
    request<void>(`/api/feeds/${postId}/likes`, { method: "DELETE" }),

  report: (postId: number) =>
    request<void>(`/api/feeds/${postId}/reports`, { method: "POST" }),

  createPhotoUploadUrl: (contentType: string) =>
    request<PhotoUploadUrlResponse>("/api/feeds/photos/upload-url", {
      method: "POST",
      body: { contentType },
    }),
};

export const chats = {
  list: (params: ChatRoomListParams = {}) =>
    request<ChatRoomPage>("/api/chats", { query: params }),

  search: (params: ChatRoomSearchParams) =>
    request<ChatRoomPage>("/api/chats/search", { query: params }),

  get: (roomId: number) => request<ChatRoomResponse>(`/api/chats/${roomId}`),

  messages: (roomId: number, params: CursorParams = {}) =>
    request<ChatMessagePage>(`/api/chats/${roomId}/messages`, {
      query: params,
    }),

  media: (roomId: number, params: CursorParams = {}) =>
    request<ChatMessagePage>(`/api/chats/${roomId}/media`, {
      query: params,
    }),

  send: (roomId: number, body: SendMessageRequest) =>
    request<ChatMessageResponse>(`/api/chats/${roomId}/messages`, {
      method: "POST",
      body,
    }),

  videoUrl: (roomId: number, messageId: number) =>
    request<ChatVideoUrlResponse>(
      `/api/chats/${roomId}/messages/${messageId}/video-url`,
    ),

  react: (roomId: number, messageId: number, type: ChatReactionType) =>
    request<ChatReactionsResponse>(
      `/api/chats/${roomId}/messages/${messageId}/reaction`,
      { method: "PUT", body: { type } },
    ),

  unreact: (roomId: number, messageId: number) =>
    request<ChatReactionsResponse>(
      `/api/chats/${roomId}/messages/${messageId}/reaction`,
      { method: "DELETE" },
    ),

  createPhotoUploadUrl: (contentType: string) =>
    request<PhotoUploadUrlResponse>("/api/chats/photos/upload-url", {
      method: "POST",
      body: { contentType },
    }),

  leave: (roomId: number) =>
    request<void>(`/api/chats/${roomId}`, { method: "DELETE" }),

  leaveAll: (roomIds: number[]) =>
    request<void>("/api/chats", { method: "DELETE", body: { roomIds } }),

  unreadCount: () => request<number>("/api/chats/unread-count"),

  updateNotification: (roomId: number, enabled: boolean) =>
    request<void>(`/api/chats/${roomId}/notification`, {
      method: "PUT",
      body: { enabled },
    }),

  updatePin: (roomId: number, enabled: boolean) =>
    request<void>(`/api/chats/${roomId}/pin`, {
      method: "PUT",
      body: { enabled },
    }),

  markRead: (roomId: number, lastReadMessageId: number) =>
    request<void>(`/api/chats/${roomId}/read`, {
      method: "POST",
      body: { lastReadMessageId },
    }),

  markAllRead: (roomIds: number[]) =>
    request<void>("/api/chats/read", { method: "POST", body: { roomIds } }),
};

export const push = {
  register: (token: string, platform: DevicePlatform, locale: MemberLocale) =>
    request<void>("/api/members/me/device-tokens", {
      method: "POST",
      body: { token, platform, locale },
    }),

  remove: (token: string) =>
    request<void>(
      `/api/members/me/device-tokens/${encodeURIComponent(token)}`,
      {
        method: "DELETE",
      },
    ),
};

export const reports = {
  create: (body: CreateReportRequest) =>
    request<void>("/api/reports", { method: "POST", body }),

  createPhotoUploadUrl: (contentType: string) =>
    request<PhotoUploadUrlResponse>("/api/reports/photos/upload-url", {
      method: "POST",
      body: { contentType },
    }),
};

export const worries = {
  list: (params: WorryListParams = {}) =>
    request<WorryPostPage>("/api/worries", { query: params }),

  search: (params: WorrySearchParams) =>
    request<WorryPostPage>("/api/worries/search", { query: params }),

  mine: (params: CursorParams = {}) =>
    request<WorryPostPage>("/api/worries/me", { query: params }),

  create: (category: WorryCategory, content: string) =>
    request<void>("/api/worries", {
      method: "POST",
      body: { category, content },
    }),

  get: (postId: number) => request<WorryPostResponse>(`/api/worries/${postId}`),

  remove: (postId: number) =>
    request<void>(`/api/worries/${postId}`, { method: "DELETE" }),

  like: (postId: number) =>
    request<void>(`/api/worries/${postId}/likes`, { method: "POST" }),

  cancelLike: (postId: number) =>
    request<void>(`/api/worries/${postId}/likes`, { method: "DELETE" }),

  report: (postId: number) =>
    request<void>(`/api/worries/${postId}/reports`, { method: "POST" }),

  comments: (postId: number, params: CursorParams = {}) =>
    request<WorryCommentPage>(`/api/worries/${postId}/comments`, {
      query: params,
    }),

  createComment: (postId: number, content: string, parentId?: number) =>
    request<void>(`/api/worries/${postId}/comments`, {
      method: "POST",
      body: { content, parentId },
    }),

  removeComment: (commentId: number) =>
    request<void>(`/api/worries/comments/${commentId}`, { method: "DELETE" }),

  reportComment: (commentId: number) =>
    request<void>(`/api/worries/comments/${commentId}/reports`, {
      method: "POST",
    }),
};

export const translations = {
  translate: (sourceType: TranslationSource, sourceId: number) =>
    request<TranslationResponse>("/api/translations", {
      method: "POST",
      body: { sourceType, sourceId },
    }),
};
