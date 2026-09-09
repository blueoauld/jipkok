import type { DiaryMood } from "@/lib/api";

// 서버 DiaryMood와 같은 순서다. 달력 칸과 카드에 이 이모지를 그린다.
export const DIARY_MOODS: DiaryMood[] = [
  "HEART",
  "STAR",
  "SPARKLES",
  "FIRE",
  "SUN",
  "MOON",
  "RAINBOW",
  "RAIN",
  "WAVE",
  "FLOWER",
  "CLOVER",
  "PARTY",
];

const MOOD_EMOJI: Record<DiaryMood, string> = {
  HEART: "❤️",
  STAR: "⭐",
  SPARKLES: "✨",
  FIRE: "🔥",
  SUN: "🌞",
  MOON: "🌙",
  RAINBOW: "🌈",
  RAIN: "☔",
  WAVE: "🌊",
  FLOWER: "🌸",
  CLOVER: "🍀",
  PARTY: "🎉",
};

// 서버가 앱보다 먼저 새 기분을 내려보낼 수 있어 모르는 값은 비운다.
export function moodEmoji(mood: DiaryMood | null | undefined) {
  return mood ? (MOOD_EMOJI[mood] ?? null) : null;
}
