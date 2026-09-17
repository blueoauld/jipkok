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
import { RetroListPanel, RetroListRow } from "@/components/ui/RetroListPanel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useAlert } from "@/hooks/useAlert";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { api, type ReportReason } from "@/lib/api";
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
  divider,
  onPress,
}: {
  label: string;
  selected: boolean;
  divider: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <RetroListRow divider={divider} justify="space-between" onPress={onPress}>
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {label}
      </Text>

      <XStack opacity={selected ? 1 : 0}>
        <CheckIcon
          size={CHECK_ICON_SIZE}
          weight="bold"
          color={theme.color.val}
        />
      </XStack>
    </RetroListRow>
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
        <YStack gap="$2">
          <SectionLabel>{t("report.evidencePhotos")}</SectionLabel>
          <PhotoGrid
            photos={photos.urls}
            onAdd={photos.add}
            onRemove={photos.remove}
            onMove={photos.move}
          />
        </YStack>

        <RetroListPanel>
          {REASONS.map((value, index) => (
            <ReasonRow
              key={value}
              label={reasonLabel(value)}
              selected={value === reason}
              divider={index < REASONS.length - 1}
              onPress={() => setReason(value)}
            />
          ))}
        </RetroListPanel>

        <DetailField valueRef={detailRef} />
      </FormScreen>

      {alertElement}
    </SafeAreaView>
  );
}
