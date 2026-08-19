import { memberReports } from "@/lib/mock/member-reports";
import type { ChatMessageSnapshot, MemberReportDetail } from "@/lib/types";

const details = [
  "프로필 사진이 다른 사람 사진 같습니다. 인스타에서 본 적 있어요.",
  null,
  "계속 욕설하고 협박성 메시지를 보냅니다.",
  "돈 빌려달라고 계속 요구합니다.",
  "미성년자로 보입니다. 학교 이야기를 했어요.",
];

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

function shift(base: string, minutes: number) {
  const date = new Date(base);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function messagesOf(
  reportedAt: string,
  reporterId: number,
  reportedId: number,
): ChatMessageSnapshot[] {
  const start = shift(reportedAt, -95);
  const script: [number, string | null, "TEXT" | "PHOTO"][] = [
    [reporterId, "안녕하세요! 프로필 보고 쪽지 드려요", "TEXT"],
    [reportedId, "네 안녕하세요", "TEXT"],
    [reportedId, null, "PHOTO"],
    [reporterId, "사진 잘 봤어요. 근처 사세요?", "TEXT"],
    [
      reportedId,
      "ㅋㅋ 그건 됐고 혹시 급하게 5만원만 빌려줄 수 있어요? 내일 바로 갚을게요",
      "TEXT",
    ],
    [reporterId, "네? 처음 뵙는데 그건 좀…", "TEXT"],
    [reportedId, "아 진짜 급해서 그래요 계좌 보낼게요", "TEXT"],
    [reportedId, "안 보내면 프로필 사진 캡처한 거 돌릴 거예요", "TEXT"],
  ];

  return script.map(([senderId, content, type], index) => ({
    id: 70000 + index,
    senderId,
    type,
    content,
    photoUrl: null,
    createdAt: shift(start, index * 11),
  }));
}

export function findMemberReportDetail(id: number): MemberReportDetail | null {
  const report = memberReports.find((r) => r.id === id);
  if (!report) return null;

  const seed = report.id % 7;

  return {
    id: report.id,
    type: report.type,
    reason: report.reason,
    detail: details[seed % details.length],
    createdAt: report.createdAt,
    handledAt: report.handledAt,
    reporter: { id: report.reporterId, nickname: report.reporterNickname },
    reported: {
      id: report.reportedMemberId,
      nickname: report.reportedNickname,
      phoneNumber: `010${String(10000000 + report.reportedMemberId * 4321).slice(-8)}`,
      gender: report.reportedMemberId % 3 === 0 ? "FEMALE" : "MALE",
      age: 22 + (report.reportedMemberId % 17),
      comment: comments[seed % comments.length],
      bio: bios[seed % bios.length],
      profilePhotoUrls: Array.from({ length: 1 + (seed % 4) }, () => null),
    },
    evidencePhotoUrls: Array.from({ length: seed % 3 }, () => null),
    messages:
      report.type === "CHAT"
        ? messagesOf(
            report.createdAt,
            report.reporterId,
            report.reportedMemberId,
          )
        : [],
  };
}
