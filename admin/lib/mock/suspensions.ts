import type {
  Suspension,
  SuspensionReason,
  SuspensionStatus,
  SuspensionType,
} from "@/lib/types";

const nicknames = [
  "밤산책",
  "구름빵",
  "서울토박이",
  "재테크왕",
  "하루종일",
  "초록불",
  "떡볶이러버",
  "달빛호수",
  "커피한잔",
  "고양이집사",
  "산들바람",
  "노을지기",
];

const types: SuspensionType[] = ["SERVICE", "SECRET_PHOTO", "PROFILE_EDIT"];

const reasons: SuspensionReason[] = [
  "OBSCENITY",
  "SCREEN_CAPTURE",
  "ABUSE",
  "MONEY_TRANSACTION",
  "IMPERSONATION",
  "MINOR",
  "ETC",
];

const durations = [7, 30, null, 3, 14, 1];

const statuses: SuspensionStatus[] = [
  "ACTIVE",
  "ACTIVE",
  "EXPIRED",
  "ACTIVE",
  "RELEASED",
  "EXPIRED",
  "ACTIVE",
];

function shift(base: string, days: number, hours = 0) {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
}

export const suspensions: Suspension[] = Array.from(
  { length: 41 },
  (_, index) => {
    const memberIndex = (index * 5 + 2) % nicknames.length;
    const status = statuses[index % statuses.length];
    const duration = durations[index % durations.length];
    const startedAt = shift(
      "2026-08-20T00:00:00Z",
      -Math.floor(index * 1.5),
      9 + (index % 10),
    );
    const expiresAt = duration === null ? null : shift(startedAt, duration);

    return {
      id: 512 - index,
      memberId: 1000 + memberIndex * 137,
      nickname: nicknames[memberIndex],
      type: types[index % types.length],
      reason: reasons[(index * 3) % reasons.length],
      startedAt,
      expiresAt:
        status === "EXPIRED" && expiresAt === null
          ? shift(startedAt, 7)
          : expiresAt,
      releasedAt: status === "RELEASED" ? shift(startedAt, 1, 3) : null,
      status,
    };
  },
);
