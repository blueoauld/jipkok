import { useMutation } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { type RefObject, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Button } from "@/components/ui/Button";
import { CountedInput } from "@/components/ui/CountedInput";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { ListRow } from "@/components/ui/ListRow";
import { useAlert } from "@/hooks/useAlert";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { api, type ReportReason } from "@/lib/api";
import {
  FIELD_TEXT_GAP,
  LIST_ROW_EVEN_PADDING_Y,
  SCREEN_PADDING,
} from "@/lib/design";
import { reportedMessage } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { uploadReportPhoto } from "@/lib/photo";
import { reasonLabel } from "@/lib/suspension";
import { REPORT_DETAIL_MAX_LENGTH } from "@/lib/validation";

const CHECK_ICON_SIZE = 22;

const REASONS: ReportReason[] = [
  "OBSCENITY",
  "MINOR",
  "MONEY_TRANSACTION",
  "ABUSE",
  "IMPERSONATION",
  "ETC",
];

function ReasonRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <ListRow
      horizontalPadding="small"
      verticalPadding={LIST_ROW_EVEN_PADDING_Y}
      right={
        <XStack opacity={selected ? 1 : 0}>
          <CheckIcon
            size={CHECK_ICON_SIZE}
            weight="bold"
            color={theme.blue500.val}
          />
        </XStack>
      }
      selectionRole="radio"
      selected={selected}
      onPress={onPress}
    >
      <Text
        numberOfLines={1}
        fontSize="$4"
        lineHeight="$4"
        fontWeight="500"
        color="$grey800"
      >
        {label}
      </Text>
    </ListRow>
  );
}

function DetailField({ valueRef }: { valueRef: RefObject<string> }) {
  const { t } = useTranslation();
  return (
    <CountedInput
      valueRef={valueRef}
      multiline
      rows={7}
      textAlignVertical="top"
      placeholder={t("report.detailPlaceholder")}
      maxLength={REPORT_DETAIL_MAX_LENGTH}
    />
  );
}

export default function ReportScreen() {
  const { t } = useTranslation();
  const { id, roomId, nickname } = useLocalSearchParams<{
    id: string;
    roomId?: string;
    nickname?: string;
  }>();
  const memberId = Number(id);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const detailRef = useRef("");
  const { alertElement, show, showApiError } = useAlert();
  const photos = useUploadPhotos(uploadReportPhoto, showApiError);

  const title = roomId ? t("report.chatTitle") : t("report.title");

  const report = useMutation({
    mutationFn: (value: ReportReason) =>
      api.reports.create({
        reportedMemberId: memberId,
        roomId: roomId ? Number(roomId) : null,
        reason: value,
        detail: detailRef.current.trim() || null,
        photoKeys: photos.objectKeys,
      }),
    onSuccess: () => show("info", reportedMessage(), () => router.back()),
    onError: showApiError,
  });

  const busy = report.isPending || photos.uploading;

  useLoadingOverlay(busy, photos.progress.done, photos.progress.total);

  // 회원 상세를 조회하면 피신고자에게 발자국이 남으므로 닉네임은 진입한 화면이 넘겨 준다.
  const screenOptions = useMemo(
    () => ({ title: nickname ? `${title} (${nickname})` : title }),
    [nickname, title],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <FormScreen
        footer={
          <Button
            size="xlarge"
            variant="danger"
            disabled={!reason || busy}
            onPress={() => reason && report.mutate(reason)}
          >
            {t("action.reportSubmit")}
          </Button>
        }
      >
        <YStack gap={FIELD_TEXT_GAP}>
          <FieldLabel>{t("report.evidencePhotos")}</FieldLabel>
          <PhotoGrid
            photos={photos.urls}
            onAdd={photos.add}
            onRemove={photos.remove}
            onMove={photos.move}
          />
        </YStack>

        {/* 행은 좌우 여백과 누름 면을 스스로 가지므로 폼 여백 밖까지 편다. */}
        <YStack mx={-SCREEN_PADDING}>
          {REASONS.map((value) => (
            <ReasonRow
              key={value}
              label={reasonLabel(value)}
              selected={value === reason}
              onPress={() => setReason(value)}
            />
          ))}
        </YStack>

        <DetailField valueRef={detailRef} />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
