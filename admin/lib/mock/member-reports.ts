import type { MemberReport, MemberReportType, ReportReason } from "@/lib/types";

const types: MemberReportType[] = ["PROFILE", "CHAT"];

const reasons: ReportReason[] = [
  "OBSCENITY",
  "MINOR",
  "MONEY_TRANSACTION",
  "ABUSE",
  "IMPERSONATION",
  "ETC",
];

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

function at(index: number, hour: number) {
  const day = 20 - Math.floor(index / 4);
  const date = new Date(Date.UTC(2026, 7, day, hour - 9, (index * 17) % 60));
  return date.toISOString();
}

export const memberReports: MemberReport[] = Array.from(
  { length: 47 },
  (_, index) => {
    const id = 1042 - index;
    const reportedIndex = (index * 5) % nicknames.length;
    const reporterIndex = (index * 7 + 3) % nicknames.length;
    const handled = index % 3 === 2;

    return {
      id,
      type: types[index % types.length],
      reason: reasons[(index * 3) % reasons.length],
      reporterId: 1000 + reporterIndex * 137,
      reporterNickname: nicknames[reporterIndex],
      reportedMemberId: 1000 + reportedIndex * 137,
      reportedNickname: nicknames[reportedIndex],
      createdAt: at(index, 9 + (index % 12)),
      handledAt: handled ? at(index, 15 + (index % 6)) : null,
    };
  },
);
