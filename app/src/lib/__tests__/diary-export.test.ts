import { diaryExportFileName, planDiaryExport } from "@/lib/diary-export";

jest.mock("expo-file-system", () => ({
  Directory: class {},
  File: class {},
  Paths: { cache: {} },
}));
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn() }));
jest.mock("react-native-zip-archive", () => ({ zip: jest.fn() }));

describe("planDiaryExport", () => {
  it("날짜와 기분 뒤에 본문과 첨부 경로를 두고 일기 사이를 빈 줄로 띄운다", () => {
    const plan = planDiaryExport([
      {
        entryDate: "2026-09-01",
        mood: "SUN",
        content: "첫날\n둘째 줄",
        attachments: [
          {
            type: "PHOTO",
            objectKey: "diaries/1/a.webp",
            url: "https://r2/diaries/1/a.webp?X-Amz-Signature=1",
            thumbnailUrl: null,
            durationSeconds: null,
          },
          {
            type: "VIDEO",
            objectKey: "diaries/1/b.mp4",
            url: "https://r2/diaries/1/b.mp4?X-Amz-Signature=2",
            thumbnailUrl: "https://r2/diaries/1/b.jpg",
            durationSeconds: 7,
          },
        ],
        updatedAt: "2026-09-01T12:00:00Z",
      },
      {
        entryDate: "2026-09-02",
        mood: null,
        content: null,
        attachments: [],
        updatedAt: "2026-09-02T12:00:00Z",
      },
    ]);

    expect(plan.text).toBe(
      [
        "2026년 9월 1일 🌞",
        "첫날\n둘째 줄",
        "첨부: 2026-09-01/1.webp, 2026-09-01/2.mp4",
        "",
        "2026년 9월 2일",
      ].join("\n"),
    );
    expect(plan.downloads).toEqual([
      {
        url: "https://r2/diaries/1/a.webp?X-Amz-Signature=1",
        path: "2026-09-01/1.webp",
      },
      {
        url: "https://r2/diaries/1/b.mp4?X-Amz-Signature=2",
        path: "2026-09-01/2.mp4",
      },
    ]);
  });

  it("URL에 확장자가 없으면 종류로 정한다", () => {
    const plan = planDiaryExport([
      {
        entryDate: "2026-09-03",
        mood: null,
        content: null,
        attachments: [
          {
            type: "VIDEO",
            objectKey: "diaries/1/c",
            url: "https://r2/diaries/1/c?sig=3",
            thumbnailUrl: null,
            durationSeconds: 3,
          },
        ],
        updatedAt: "2026-09-03T12:00:00Z",
      },
    ]);

    expect(plan.downloads[0].path).toBe("2026-09-03/1.mp4");
  });

  it("파일 이름에 날짜를 넣는다", () => {
    expect(diaryExportFileName(new Date(2026, 8, 10))).toBe(
      "집콕 일기 2026-09-10",
    );
  });
});
