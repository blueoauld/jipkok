import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { zip } from "react-native-zip-archive";

import { api, type DiaryResponse } from "@/lib/api";
import { formatFullDate, fromDateParam, toDateParam } from "@/lib/date";
import { moodEmoji } from "@/lib/diary";
import i18n from "@/lib/i18n";

const ZIP_MIME_TYPE = "application/zip";

const EXTENSION_BY_TYPE = { PHOTO: "webp", VIDEO: "mp4" } as const;

export type DiaryExportProgress = (done: number, total: number) => void;

export type DiaryExportDownload = {
  url: string;
  path: string;
};

export type DiaryExportPlan = {
  text: string;
  downloads: DiaryExportDownload[];
};

// 서명 URL은 쿼리가 붙어 있어 경로만 떼어 확장자를 읽는다. 없으면 종류로 정한다.
function extensionOf(url: string, type: keyof typeof EXTENSION_BY_TYPE) {
  const path = url.split("?")[0];
  const dot = path.lastIndexOf(".");
  const slash = path.lastIndexOf("/");

  return dot > slash ? path.slice(dot + 1) : EXTENSION_BY_TYPE[type];
}

// 날짜 한 줄 뒤에 본문, 첨부가 있으면 파일 경로를 한 줄로 붙이고 일기 사이는 빈 줄 하나.
// 첨부는 날짜 폴더 아래에 순서대로 번호를 매겨 둔다.
export function planDiaryExport(items: DiaryResponse[]): DiaryExportPlan {
  const downloads: DiaryExportDownload[] = [];
  const text = items
    .map((item) => {
      const emoji = moodEmoji(item.mood);
      const lines = [
        `${formatFullDate(fromDateParam(item.entryDate))}${emoji ? ` ${emoji}` : ""}`,
      ];

      if (item.content) {
        lines.push(item.content);
      }

      const paths = item.attachments.map((attachment, index) => {
        const path = `${item.entryDate}/${index + 1}.${extensionOf(attachment.url, attachment.type)}`;

        downloads.push({ url: attachment.url, path });

        return path;
      });

      if (paths.length > 0) {
        lines.push(`${i18n.t("diary.exportAttachments")}: ${paths.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");

  return { text, downloads };
}

export function diaryExportFileName(now = new Date()) {
  return i18n.t("diary.exportFileName", { date: toDateParam(now) });
}

async function download(
  root: Directory,
  downloads: DiaryExportDownload[],
  onProgress: DiaryExportProgress,
) {
  for (const [index, { url, path }] of downloads.entries()) {
    onProgress(index + 1, downloads.length);

    const [folder, name] = path.split("/");
    const directory = new Directory(root, folder);

    directory.create({ intermediates: true, idempotent: true });
    await File.downloadFileAsync(url, new File(directory, name));
  }
}

// 캐시에 폴더를 만들어 텍스트와 첨부를 모은 뒤 zip 하나로 묶어 공유 시트에 넘긴다.
// 공유가 끝나면 폴더와 zip을 모두 지운다.
export async function exportDiaries(
  onProgress: DiaryExportProgress,
): Promise<"shared" | "empty"> {
  const items = await api.diaries.export();

  if (items.length === 0) {
    return "empty";
  }

  const name = diaryExportFileName();
  const plan = planDiaryExport(items);
  const root = new Directory(Paths.cache, name);
  const archive = new File(Paths.cache, `${name}.zip`);

  try {
    root.create({ intermediates: true, overwrite: true });
    new File(root, `${name}.txt`).write(plan.text);
    await download(root, plan.downloads, onProgress);
    // zip 모듈은 file://만 떼고 퍼센트 인코딩은 풀지 않아서, 한글과 공백이 든 경로는 풀어서 넘겨야 실제 위치에 만든다.
    await zip(decodeURI(root.uri), decodeURI(archive.uri));
    await Sharing.shareAsync(archive.uri, {
      mimeType: ZIP_MIME_TYPE,
      dialogTitle: i18n.t("setting.menu.exportDiary"),
    });
  } finally {
    root.delete();

    if (archive.exists) {
      archive.delete();
    }
  }

  return "shared";
}
