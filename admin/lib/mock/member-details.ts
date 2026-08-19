import { memberReports } from "@/lib/mock/member-reports";
import { members } from "@/lib/mock/members";
import { suspensions } from "@/lib/mock/suspensions";
import type { MemberDetail } from "@/lib/types";

const comments = [
  "동네 친구 구해요",
  null,
  "산책 좋아합니다",
  "커피 한 잔 해요",
];

const bios = [
  "퇴근하고 한강 러닝하는 게 낙입니다. 같이 뛰실 분 환영해요.",
  null,
  "고양이 두 마리랑 살아요. 사진 교환 환영.",
];

export function findMemberDetail(id: number): MemberDetail | null {
  const member = members.find((m) => m.id === id);
  const seed = id % 7;

  const base = member ?? fromReports(id);
  if (!base) return null;

  const memberSuspensions = suspensions.filter((s) => s.memberId === id);

  return {
    id,
    nickname: base.nickname,
    phoneNumber: base.phoneNumber,
    gender: base.gender,
    age: base.age,
    comment: comments[seed % comments.length],
    bio: bios[seed % bios.length],
    receivedLikeCount: (id * 7) % 140,
    pointBalance: (id * 13) % 3000,
    noteReceiveEnabled: seed % 3 !== 0,
    latitude: seed % 4 === 0 ? null : 37.49 + (id % 100) / 1000,
    longitude: seed % 4 === 0 ? null : 126.99 + (id % 70) / 1000,
    locatedAt: seed % 4 === 0 ? null : shift(base.joinedAt, 5 + seed),
    joinedAt: base.joinedAt,
    publicPhotoUrls: Array.from({ length: base.publicPhotoCount }, () => null),
    secretPhotoUrls: Array.from({ length: base.secretPhotoCount }, () => null),
    suspensions: memberSuspensions,
    receivedReports: memberReports.filter((r) => r.reportedMemberId === id),
  };
}

function fromReports(id: number) {
  const report = memberReports.find((r) => r.reportedMemberId === id);
  if (!report) return null;

  return {
    nickname: report.reportedNickname,
    phoneNumber: `010${String(10000000 + id * 4321).slice(-8)}`,
    gender: id % 3 === 0 ? ("FEMALE" as const) : ("MALE" as const),
    age: 22 + (id % 17),
    publicPhotoCount: 1 + (id % 4),
    secretPhotoCount: id % 3,
    joinedAt: "2026-06-12T04:30:00.000Z",
  };
}

function shift(base: string, days: number) {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
