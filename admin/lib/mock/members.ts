import type { MemberSummary } from "@/lib/types";

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
  "비오는날",
  "책읽는밤",
  "주말농부",
  "한강러너",
  "야식요정",
  "새벽배송",
  "퇴근길",
  "동네형",
];

function joinedAt(index: number) {
  const date = new Date(Date.UTC(2026, 7, 20, 0, 0));
  date.setUTCHours(date.getUTCHours() - index * 7 - (index % 5) * 3);
  return date.toISOString();
}

export const members: MemberSummary[] = Array.from(
  { length: 63 },
  (_, index) => {
    const nickname = nicknames[index % nicknames.length];
    const suffix = Math.floor(index / nicknames.length);

    return {
      id: 5204 - index * 3,
      nickname: suffix === 0 ? nickname : `${nickname}${suffix + 1}`,
      gender: index % 3 === 0 ? "FEMALE" : "MALE",
      age: 20 + ((index * 7) % 25),
      phoneNumber: `010${String(10000000 + index * 1234567).slice(-8)}`,
      publicPhotoCount: (index * 2) % 6,
      secretPhotoCount: index % 4 === 0 ? (index % 3) + 1 : 0,
      suspended: index % 9 === 4,
      withdrawnAt: index % 11 === 7 ? joinedAt(index - 2) : null,
      joinedAt: joinedAt(index),
    };
  },
);
