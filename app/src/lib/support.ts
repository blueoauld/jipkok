import * as Device from "expo-device";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

import { getLastFailedRequestId } from "@/lib/api/request-id";
import { APP_VERSION, DEVICE_NAME } from "@/lib/device";
import i18n from "@/lib/i18n";

const EMAIL = "hello@jipkok.app";

export const MAIL_FAILED_MESSAGE = i18n.t("support.mailFailed", {
  email: EMAIL,
});

export const TERMS_URL = "https://jipkok.app/terms";
export const PRIVACY_URL = "https://jipkok.app/privacy";
export const BROWSER_FAILED_MESSAGE = i18n.t("support.browserFailed");

const APP_NAME = i18n.t("support.appName");
const PLACEHOLDER = i18n.t("support.placeholder");
const DIVIDER = "────────────";

const UNKNOWN = "-";

function deviceInfo(memberId?: number) {
  return [
    i18n.t("support.appVersion", { version: APP_VERSION }),
    i18n.t("support.device", { device: DEVICE_NAME ?? UNKNOWN }),
    `OS: ${Device.osName ?? UNKNOWN} ${Device.osVersion ?? UNKNOWN}`,
    i18n.t("support.memberId", { id: memberId ?? UNKNOWN }),
    i18n.t("support.requestId", { id: getLastFailedRequestId() ?? UNKNOWN }),
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
