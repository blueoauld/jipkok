import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { getTokens, Text } from "tamagui";

import { DiaryAttachmentStrip } from "@/components/diary/DiaryAttachmentStrip";
import { RetroCard } from "@/components/ui/RetroCard";
import type { DiaryDraftAttachment } from "@/hooks/useDiaryAttachments";
import { useDiaryAttachmentViewer } from "@/hooks/useDiaryAttachmentViewer";
import type { DiaryResponse } from "@/lib/api";
import { copyText } from "@/lib/clipboard";

export function DiaryReader({ diary }: { diary: DiaryResponse }) {
  const { t } = useTranslation();
  const items = useMemo<DiaryDraftAttachment[]>(
    () =>
      diary.attachments.map((attachment) => ({
        kind: "saved",
        key: attachment.objectKey,
        attachment,
      })),
    [diary.attachments],
  );
  const viewer = useDiaryAttachmentViewer(items);
  const content = diary.content ?? "";
  const gutter = getTokens().space.$4.val;

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: gutter, gap: gutter }}
        showsVerticalScrollIndicator={false}
      >
        {items.length > 0 && (
          <DiaryAttachmentStrip items={items} onPress={viewer.open} />
        )}

        {content.length > 0 && (
          <RetroCard onLongPress={() => copyText(content, t("diary.copied"))}>
            <Text fontSize="$4">{content}</Text>
          </RetroCard>
        )}
      </ScrollView>

      {viewer.element}
    </>
  );
}
