import type { FeedReport } from "@/lib/types";

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

const captions = [
  "퇴근길 노을",
  null,
  "오늘 저녁은 떡볶이",
  "한강 산책 중",
  null,
  "주말 카페",
  "비 오는 날",
];

const posts = Array.from({ length: 14 }, (_, index) => {
  const authorIndex = (index * 5 + 1) % nicknames.length;
  const reportCount = [1, 2, 5, 1, 3, 6, 2, 1, 4, 5, 1, 2, 1, 3][index];

  return {
    id: 8800 - index * 3,
    authorId: 1000 + authorIndex * 137,
    authorNickname: nicknames[authorIndex],
    caption: captions[index % captions.length],
    reportCount,
    deleted: reportCount >= 5,
  };
});

function at(index: number, hour: number) {
  const day = 20 - Math.floor(index / 3);
  const date = new Date(Date.UTC(2026, 7, day, hour - 9, (index * 23) % 60));
  return date.toISOString();
}

export const feedReports: FeedReport[] = Array.from(
  { length: 38 },
  (_, index) => {
    const post = posts[index % posts.length];
    const reporterIndex = (index * 7 + 4) % nicknames.length;
    const createdAt = at(index, 8 + (index % 13));

    return {
      id: 2210 - index,
      reporterId: 1000 + reporterIndex * 137,
      reporterNickname: nicknames[reporterIndex],
      postId: post.id,
      authorId: post.authorId,
      authorNickname: post.authorNickname,
      thumbnailUrl: null,
      caption: post.caption,
      postReportCount: post.reportCount,
      postDeletedAt: post.deleted ? createdAt : null,
      createdAt,
    };
  },
);
