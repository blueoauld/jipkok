import * as Device from "expo-device";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

import { getLastFailedRequestId } from "@/lib/api/request-id";
import { APP_VERSION, DEVICE_NAME } from "@/lib/device";

const EMAIL = "hello@jipkok.app";

export const MAIL_FAILED_MESSAGE = `${EMAIL}으로 메일을 보내주시길 바랍니다.`;

export const TERMS_URL = "https://jipkok.app/terms";
export const PRIVACY_URL = "https://jipkok.app/privacy";
export const BROWSER_FAILED_MESSAGE = "페이지를 열지 못했습니다.";

const APP_NAME = "집콕";
const PLACEHOLDER = "(여기에 내용을 적어주세요)";
const DIVIDER = "────────────";

const UNKNOWN = "-";

function deviceInfo(memberId?: number) {
  return [
    `앱 버전: ${APP_VERSION}`,
    `기기: ${DEVICE_NAME ?? UNKNOWN}`,
    `OS: ${Device.osName ?? UNKNOWN} ${Device.osVersion ?? UNKNOWN}`,
    `회원 ID: ${memberId ?? UNKNOWN}`,
    `요청 ID: ${getLastFailedRequestId() ?? UNKNOWN}`,
  ].join("\n");
}

type ShowError = (variant: "error", message: string) => void;

export function openSupportMail(
  title: string,
  memberId: number | undefined,
  show: ShowError,
) {
  const subject = `[${APP_NAME}] ${title}`;
  const body = `${PLACEHOLDER}\n\n\n${DIVIDER}\n${deviceInfo(memberId)}`;

  return Linking.openURL(
    `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  ).catch(() => show("error", MAIL_FAILED_MESSAGE));
}

export function openWebPage(url: string, show: ShowError) {
  return WebBrowser.openBrowserAsync(url).catch(() =>
    show("error", BROWSER_FAILED_MESSAGE),
  );
}
