import { request } from "./client";
import { clearTokens, getRefreshToken, saveTokens } from "./tokens";
import type {
  AttendanceResponse,
  ChatMessagePage,
  ChatMessageResponse,
  ChatRoomPage,
  ChatRoomResponse,
  CreateFeedPostRequest,
  CreatePhotoUploadUrlRequest,
  CreateReportRequest,
  DevicePlatform,
  EditProfileRequest,
  FeedPhotoUploadUrlResponse,
  FeedPostPage,
  Gender,
  HeartbeatRequest,
  LoginRequest,
  MemberDetailResponse,
  MemberListPage,
  MemberSearchPage,
  MemberSort,
  MemberSummaryPage,
  MyProfileResponse,
  PhotoUploadUrlResponse,
  PointHistoryPage,
  PointRewardResponse,
  SendMessageRequest,
  SendNoteResponse,
  SetupProfileRequest,
  SignupRequest,
  SignupResponse,
  TokenResponse,
  UpdateCommentRequest,
} from "./types";

type CursorParams = { cursor?: number; size?: number };

type FeedListParams = {
  gender?: Gender;
  date?: string;
  cursor?: number;
  size?: number;
};

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

type ChatRoomListParams = {
  unreadOnly?: boolean;
  cursor?: number;
  size?: number;
};

type ChatRoomSearchParams = {
  keyword: string;
  cursor?: number;
  size?: number;
};

type MemberListParams = {
  sort?: MemberSort;
  gender?: Gender;
  cursor?: string;
  size?: number;
};

export const auth = {
  sendVerificationCode: (phoneNumber: string) =>
    request<void>("/api/auth/verification-codes", {
      method: "POST",
      body: { phoneNumber },
      auth: false,
    }),

  login: async (body: LoginRequest) => {
    const tokens = await request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body,
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
    const response = await request<SignupResponse>("/api/members", {
      method: "POST",
      body,
      auth: false,
    });
    await saveTokens(response);

    return response;
  },

  list: (params: MemberListParams = {}) =>
    request<MemberListPage>("/api/members", { query: params }),

  ranking: (params: MemberRankingParams = {}) =>
    request<MemberSearchPage>("/api/members/ranking", { query: params }),

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

  updateFeedNotification: (enabled: boolean) =>
    request<void>("/api/members/me/feed-notification", {
      method: "PUT",
      body: { enabled },
    }),

  updateComment: (body: UpdateCommentRequest) =>
    request<void>("/api/members/me/comment", { method: "PUT", body }),

  heartbeat: (body: HeartbeatRequest) =>
    request<void>("/api/members/me/heartbeat", { method: "POST", body }),

  withdraw: async () => {
    await request<void>("/api/members/me", { method: "DELETE" });
    await clearTokens();
  },

  createPhotoUploadUrl: (body: CreatePhotoUploadUrlRequest) =>
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

export const blocks = {
  ...relation("blocks"),

  mine: (params: CursorParams = {}) =>
    request<MemberSummaryPage>("/api/members/me/blocks", { query: params }),
};

export const points = {
  balance: () => request<number>("/api/points/me"),

  histories: (params: CursorParams = {}) =>
    request<PointHistoryPage>("/api/points/me/histories", { query: params }),

  earnAccessReward: () =>
    request<PointRewardResponse>("/api/points/rewards/access", {
      method: "POST",
    }),
};

export const attendances = {
  checkIn: () =>
    request<AttendanceResponse>("/api/attendances", { method: "POST" }),
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
    request<FeedPhotoUploadUrlResponse>("/api/feeds/photos/upload-url", {
      method: "POST",
      body: { contentType },
    }),
};

export const chats = {
  list: (params: ChatRoomListParams = {}) =>
    request<ChatRoomPage>("/api/chats", { query: params }),

  get: (roomId: number) => request<ChatRoomResponse>(`/api/chats/${roomId}`),

  messages: (roomId: number, params: CursorParams = {}) =>
    request<ChatMessagePage>(`/api/chats/${roomId}/messages`, {
      query: params,
    }),

  unreadCount: () => request<number>("/api/chats/unread-count"),

  markRead: (roomId: number, lastReadMessageId: number) =>
    request<void>(`/api/chats/${roomId}/read`, {
      method: "POST",
      body: { lastReadMessageId },
    }),

  leave: (roomId: number) =>
    request<void>(`/api/chats/${roomId}`, { method: "DELETE" }),

  send: (roomId: number, body: SendMessageRequest) =>
    request<ChatMessageResponse>(`/api/chats/${roomId}/messages`, {
      method: "POST",
      body,
    }),

  createPhotoUploadUrl: (contentType: string) =>
    request<PhotoUploadUrlResponse>("/api/chats/photos/upload-url", {
      method: "POST",
      body: { contentType },
    }),

  search: (params: ChatRoomSearchParams) =>
    request<ChatRoomPage>("/api/chats/search", { query: params }),

  sendNote: (memberId: number, content: string) =>
    request<SendNoteResponse>(`/api/members/${memberId}/notes`, {
      method: "POST",
      body: { content },
    }),
};

export const push = {
  register: (token: string, platform: DevicePlatform) =>
    request<void>("/api/members/me/device-tokens", {
      method: "POST",
      body: { token, platform },
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
