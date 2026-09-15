import type {
  AiMemberDetail,
  CreateAiMemberBody,
  Gender,
  UpdateAiMemberBody,
} from "@/lib/types";

export type AiMemberDraft = {
  nickname: string;
  gender: Gender;
  birthYear: string;
  comment: string;
  bio: string;
  latitude: string;
  longitude: string;
  enabled: boolean;
  systemPrompt: string;
  replyDelayMinSeconds: string;
  replyDelayMaxSeconds: string;
  activeStartHour: string;
  activeEndHour: string;
  dailyReplyLimit: string;
  greetingEnabled: boolean;
  dailyGreetingLimit: string;
};

export const defaultAiMemberDraft: AiMemberDraft = {
  nickname: "",
  gender: "FEMALE",
  birthYear: "1998",
  comment: "",
  bio: "",
  latitude: "",
  longitude: "",
  enabled: true,
  systemPrompt: "",
  replyDelayMinSeconds: "10",
  replyDelayMaxSeconds: "180",
  activeStartHour: "8",
  activeEndHour: "1",
  dailyReplyLimit: "500",
  greetingEnabled: false,
  dailyGreetingLimit: "20",
};

export function draftOf(member: AiMemberDetail): AiMemberDraft {
  return {
    nickname: member.nickname,
    gender: member.gender,
    birthYear: String(member.birthYear),
    comment: member.comment ?? "",
    bio: member.bio ?? "",
    latitude: member.latitude != null ? String(member.latitude) : "",
    longitude: member.longitude != null ? String(member.longitude) : "",
    enabled: member.persona.enabled,
    systemPrompt: member.persona.systemPrompt,
    replyDelayMinSeconds: String(member.persona.replyDelayMinSeconds),
    replyDelayMaxSeconds: String(member.persona.replyDelayMaxSeconds),
    activeStartHour: String(member.persona.activeStartHour),
    activeEndHour: String(member.persona.activeEndHour),
    dailyReplyLimit: String(member.persona.dailyReplyLimit),
    greetingEnabled: member.persona.greetingEnabled,
    dailyGreetingLimit: String(member.persona.dailyGreetingLimit),
  };
}

export function updateBodyOf(draft: AiMemberDraft): UpdateAiMemberBody {
  return {
    nickname: draft.nickname.trim(),
    birthYear: Number(draft.birthYear),
    comment: draft.comment.trim() || undefined,
    bio: draft.bio.trim() || undefined,
    latitude: Number(draft.latitude),
    longitude: Number(draft.longitude),
    persona: {
      enabled: draft.enabled,
      systemPrompt: draft.systemPrompt.trim(),
      replyDelayMinSeconds: Number(draft.replyDelayMinSeconds),
      replyDelayMaxSeconds: Number(draft.replyDelayMaxSeconds),
      activeStartHour: Number(draft.activeStartHour),
      activeEndHour: Number(draft.activeEndHour),
      dailyReplyLimit: Number(draft.dailyReplyLimit),
      greetingEnabled: draft.greetingEnabled,
      dailyGreetingLimit: Number(draft.dailyGreetingLimit),
    },
  };
}

export function createBodyOf(draft: AiMemberDraft): CreateAiMemberBody {
  return { ...updateBodyOf(draft), gender: draft.gender };
}

export function isDraftComplete(draft: AiMemberDraft) {
  return (
    draft.nickname.trim() !== "" &&
    draft.systemPrompt.trim() !== "" &&
    draft.latitude.trim() !== "" &&
    draft.longitude.trim() !== "" &&
    Number.isFinite(Number(draft.latitude)) &&
    Number.isFinite(Number(draft.longitude))
  );
}
