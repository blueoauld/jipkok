import { useMutation } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CheckIcon } from "phosphor-react-native";
import { useState } from "react";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button, Text, useTheme, XStack, YStack } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";
import { PhotoGrid } from "@/components/PhotoGrid";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { useUploadPhotos } from "@/hooks/useUploadPhotos";
import { alertApiError, alertInfo } from "@/lib/alert";
import { api, type ReportReason } from "@/lib/api";
import { DISABLED_OPACITY } from "@/lib/design";
import { useLoadingOverlay } from "@/lib/overlay/store";
import { uploadReportPhoto } from "@/lib/photo";

const BOTTOM_BAR_HEIGHT = 80;
const DETAIL_MAX_LENGTH = 1000;

const REASONS: { label: string; value: ReportReason }[] = [
  { label: "음란물", value: "OBSCENITY" },
  { label: "미성년자", value: "MINOR" },
  { label: "금전거래", value: "MONEY_TRANSACTION" },
  { label: "욕설 및 협박", value: "ABUSE" },
  { label: "사칭 및 도용", value: "IMPERSONATION" },
  { label: "기타", value: "ETC" },
];

const REPORTED_MESSAGE = "신고를 접수했습니다.";

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
    <XStack
      items="center"
      justify="space-between"
      px="$4"
      py="$3"
      pressStyle={{ bg: "$gray5" }}
      onPress={onPress}
    >
      <Text flex={1} numberOfLines={1} fontSize="$4">
        {label}
      </Text>

      <XStack opacity={selected ? 1 : 0}>
        <CheckIcon size={20} weight="bold" color={theme.color.val} />
      </XStack>
    </XStack>
  );
}

export default function ReportScreen() {
  const { id, roomId } = useLocalSearchParams<{
    id: string;
    roomId?: string;
  }>();
  const memberId = Number(id);
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const photos = useUploadPhotos(uploadReportPhoto);

  const { data: member } = useMemberDetail(memberId);
  const title = roomId ? "채팅 신고" : "신고";

  const report = useMutation({
    mutationFn: (value: ReportReason) =>
      api.reports.create({
        reportedMemberId: memberId,
        roomId: roomId ? Number(roomId) : null,
        reason: value,
        detail: detail || null,
        photoKeys: photos.objectKeys,
      }),
    onSuccess: () => {
      router.back();
      alertInfo(REPORTED_MESSAGE);
    },
    onError: alertApiError,
  });

  const busy = report.isPending || photos.uploading;

  useLoadingOverlay(busy);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen
        options={{ title: member ? `${title} (${member.nickname})` : title }}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={BOTTOM_BAR_HEIGHT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" p="$4" pb={BOTTOM_BAR_HEIGHT}>
          <YStack gap="$2">
            <Text theme="gray" color="$color10" fontSize="$3" fontWeight="600">
              증거 사진
            </Text>
            <PhotoGrid
              photos={photos.urls}
              onAdd={photos.add}
              onRemove={photos.remove}
              onMove={photos.move}
            />
          </YStack>

          <YStack bg="$gray4" rounded="$7" overflow="hidden">
            {REASONS.map(({ label, value }) => (
              <ReasonRow
                key={value}
                label={label}
                selected={value === reason}
                onPress={() => setReason(value)}
              />
            ))}
          </YStack>

          <FormField
            right={
              <Text theme="gray" color="$color10">
                {`${detail.length} / ${DETAIL_MAX_LENGTH}`}
              </Text>
            }
          >
            <FormInput
              multiline
              rows={7}
              textAlignVertical="top"
              placeholder="상세 내용"
              maxLength={DETAIL_MAX_LENGTH}
              value={detail}
              onChangeText={setDetail}
            />
          </FormField>
        </YStack>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <YStack px="$4" py="$4" bg="$background">
          <Button
            size="$4"
            theme="red"
            rounded="$7"
            disabled={!reason || busy}
            opacity={!reason || busy ? DISABLED_OPACITY : 1}
            onPress={() => reason && report.mutate(reason)}
          >
            신고하기
          </Button>
        </YStack>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
