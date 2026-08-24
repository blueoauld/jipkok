import { useMutation } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { type RefObject, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroListPanel, RetroListRow } from "@/components/ui/RetroListPanel";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { api, type ReportReason } from "@/lib/api";
import { reportedMessage } from "@/lib/message";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { uploadReportPhoto } from "@/lib/photo";
import { reasonLabel } from "@/lib/suspension";

const DETAIL_MAX_LENGTH = 1000;
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
        <CheckIcon size={20} weight="bold" color={theme.color.val} />
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
      maxLength={DETAIL_MAX_LENGTH}
    />
  );
}

export default function ReportScreen() {
  const { t } = useTranslation();
  const { id, roomId } = useLocalSearchParams<{
    id: string;
    roomId?: string;
  }>();
  const memberId = Number(id);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const detailRef = useRef("");
  const { alertElement, show, showApiError } = useRetroAlert();
  const photos = useUploadPhotos(uploadReportPhoto, showApiError);

  const { data: member } = useMemberDetail(memberId);
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

  const screenOptions = useMemo(
    () => ({ title: member ? `${title} (${member.nickname})` : title }),
    [member, title],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <FormScreen
        footer={
          <RetroButton
            theme="red"
            disabled={!reason || busy}
            onPress={() => reason && report.mutate(reason)}
          >
            {t("action.reportSubmit")}
          </RetroButton>
        }
      >
        <YStack gap="$2">
          <Text theme="gray" color="$color11" fontSize="$3" fontWeight="600">
            {t("report.evidencePhotos")}
          </Text>
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
