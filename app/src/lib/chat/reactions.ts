import type { ChatReactionResponse, ChatReactionType } from "@/lib/api";

export const REACTION_TYPES = [
  "LIKE",
  "HEART",
  "LAUGH",
  "WOW",
  "SAD",
] as const satisfies readonly ChatReactionType[];

export const REACTION_EMOJI: Record<ChatReactionType, string> = {
  LIKE: "👍",
  HEART: "❤️",
  LAUGH: "😂",
  WOW: "😮",
  SAD: "😢",
};

type ReactionGroup = {
  type: ChatReactionType;
  emoji: string;
  count: number;
  reacted: boolean;
};

// 내 반응이 앞에 오도록 이모지별로 묶는다.
export function groupReactions(
  reactions: ChatReactionResponse[],
  myMemberId: number,
): ReactionGroup[] {
  const groups = new Map<string, ReactionGroup>();
  const ordered = [
    ...reactions.filter((reaction) => reaction.memberId === myMemberId),
    ...reactions.filter((reaction) => reaction.memberId !== myMemberId),
  ];

  for (const reaction of ordered) {
    const emoji = REACTION_EMOJI[reaction.type];
    const group = groups.get(emoji) ?? {
      type: reaction.type,
      emoji,
      count: 0,
      reacted: false,
    };

    groups.set(emoji, {
      type: group.type,
      emoji,
      count: group.count + 1,
      reacted: group.reacted || reaction.memberId === myMemberId,
    });
  }

  return [...groups.values()];
}
