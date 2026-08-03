import Constants from "expo-constants";
import * as Device from "expo-device";
import { Linking } from "react-native";

import { getLastFailedRequestId } from "@/lib/api/request-id";

const EMAIL = "hello@jipkok.app";

export const MAIL_FAILED_MESSAGE = `${EMAIL}으로 메일을 보내주시길 바랍니다.`;

const APP_NAME = "집콕";
const PLACEHOLDER = "(여기에 내용을 적어주세요)";
const DIVIDER = "────────────";

const UNKNOWN = "-";

function deviceInfo(memberId?: number) {
  return [
    `앱 버전: ${Constants.expoConfig?.version ?? UNKNOWN}`,
    `기기: ${Device.modelName ?? UNKNOWN}`,
    `OS: ${Device.osName ?? UNKNOWN} ${Device.osVersion ?? UNKNOWN}`,
    `회원 ID: ${memberId ?? UNKNOWN}`,
    `요청 ID: ${getLastFailedRequestId() ?? UNKNOWN}`,
  ].join("\n");
}

export function openSupportMail(title: string, memberId?: number) {
  const subject = `[${APP_NAME}] ${title}`;
  const body = `${PLACEHOLDER}\n\n\n${DIVIDER}\n${deviceInfo(memberId)}`;

  return Linking.openURL(
    `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  );
}
