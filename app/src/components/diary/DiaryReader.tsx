import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { DiaryAttachmentStrip } from "@/components/diary/DiaryAttachmentStrip";
import { Text } from "@/components/ui/Text";
import type { DiaryDraftAttachment } from "@/hooks/useDiaryAttachments";
import { useDiaryAttachmentViewer } from "@/hooks/useDiaryAttachmentViewer";
import type { DiaryResponse } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { SCREEN_PADDING } from "@/lib/design";

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

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SCREEN_PADDING, gap: SCREEN_PADDING }}
        showsVerticalScrollIndicator={false}
      >
        {items.length > 0 && (
          <DiaryAttachmentStrip items={items} onPress={viewer.open} />
        )}

        {content.length > 0 && (
          <Text
            preset="body"
            color="$grey800"
            onLongPress={() => copyText(content, t("diary.copied"))}
          >
            {content}
          </Text>
        )}
      </ScrollView>

      {viewer.element}
    </>
  );
}
