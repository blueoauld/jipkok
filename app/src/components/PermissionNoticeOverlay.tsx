import type { Icon } from "phosphor-react-native";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { MapPinIcon } from "phosphor-react-native/src/icons/MapPin";
import { MicrophoneIcon } from "phosphor-react-native/src/icons/Microphone";
import { ScanSmileyIcon } from "phosphor-react-native/src/icons/ScanSmiley";
import { TargetIcon } from "phosphor-react-native/src/icons/Target";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { FormScreen } from "@/components/FormScreen";
import { Button } from "@/components/ui/Button";
import { ListRowIcon } from "@/components/ui/ListRow";
import { Text } from "@/components/ui/Text";
import { useBlockGoBack } from "@/hooks/useBlockGoBack";
import type { ko } from "@/lib/i18n/ko";
import { usePermissionNoticeStore } from "@/lib/permission/store";

type PermissionKey =
  `permissionNotice.${keyof (typeof ko)["permissionNotice"]}`;

type Permission = {
  icon: Icon;
  name: PermissionKey;
  reason: PermissionKey;
};

// 앱이 허용을 묻는 권한을 빠짐없이 알려야 하므로, 새로 묻는 권한이 생기면 여기에도 넣는다.
const PERMISSIONS: Permission[] = [
  {
    icon: MapPinIcon,
    name: "permissionNotice.location",
    reason: "permissionNotice.locationReason",
  },
  {
    icon: ImageIcon,
    name: "permissionNotice.photos",
    reason: "permissionNotice.photosReason",
  },
  {
    icon: CameraIcon,
    name: "permissionNotice.camera",
    reason: "permissionNotice.cameraReason",
  },
  {
    icon: MicrophoneIcon,
    name: "permissionNotice.microphone",
    reason: "permissionNotice.microphoneReason",
  },
  {
    icon: BellIcon,
    name: "permissionNotice.notifications",
    reason: "permissionNotice.notificationsReason",
  },
  ...Platform.select<Permission[]>({
    ios: [
      {
        icon: TargetIcon,
        name: "permissionNotice.tracking",
        reason: "permissionNotice.trackingReason",
      },
      {
        icon: ScanSmileyIcon,
        name: "permissionNotice.faceId",
        reason: "permissionNotice.faceIdReason",
      },
    ],
    default: [],
  }),
];

const SETTINGS_NOTE =
  Platform.OS === "ios"
    ? "permissionNotice.settingsNoteIos"
    : "permissionNotice.settingsNoteAndroid";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <YStack gap="$3">
      <Text preset="subStrong" color="$grey800">
        {title}
      </Text>

      {children}
    </YStack>
  );
}

// 정보통신망법 제22조의2가 요구하는 접근권한 사전 고지다. 필수와 선택을 나눠 항목과 이유를 알린다.
function PermissionNotice() {
  const { t } = useTranslation();
  const theme = useTheme();
  const markSeen = usePermissionNoticeStore((state) => state.markSeen);

  useBlockGoBack();

  return (
    <YStack
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: theme.background.val },
      ]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <FormScreen
          footer={
            <Button size="xlarge" onPress={markSeen}>
              {t("component.confirm")}
            </Button>
          }
        >
          <YStack gap="$2">
            <Text preset="title" color="$grey900">
              {t("permissionNotice.title")}
            </Text>
            <Text preset="body" color="$grey600">
              {t("permissionNotice.description")}
            </Text>
          </YStack>

          <Section title={t("permissionNotice.required")}>
            <Text preset="body" color="$grey600">
              {t("permissionNotice.requiredNone")}
            </Text>
          </Section>

          <Section title={t("permissionNotice.optional")}>
            {PERMISSIONS.map(({ icon, name, reason }) => (
              <XStack key={name} gap="$3" items="center">
                <ListRowIcon icon={icon} />

                <YStack flex={1}>
                  <Text preset="label" color="$grey800">
                    {t(name)}
                  </Text>
                  <Text preset="sub" color="$grey600">
                    {t(reason)}
                  </Text>
                </YStack>
              </XStack>
            ))}
          </Section>

          <YStack gap="$2">
            <Text preset="note" color="$grey500">
              {t("permissionNotice.optionalNote")}
            </Text>
            <Text preset="note" color="$grey500">
              {t(SETTINGS_NOTE)}
            </Text>
          </YStack>
        </FormScreen>
      </SafeAreaView>
    </YStack>
  );
}

export function PermissionNoticeOverlay() {
  const seen = usePermissionNoticeStore((state) => state.seen);

  return seen ? null : <PermissionNotice />;
}
