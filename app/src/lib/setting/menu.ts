import type { Href } from "expo-router";
import type { Icon } from "phosphor-react-native";
import { AddressBookIcon } from "phosphor-react-native/src/icons/AddressBook";
import { CalendarCheckIcon } from "phosphor-react-native/src/icons/CalendarCheck";
import { ChatCircleTextIcon } from "phosphor-react-native/src/icons/ChatCircleText";
import { CoinsIcon } from "phosphor-react-native/src/icons/Coins";
import { EyeIcon } from "phosphor-react-native/src/icons/Eye";
import { FileTextIcon } from "phosphor-react-native/src/icons/FileText";
import { FootprintsIcon } from "phosphor-react-native/src/icons/Footprints";
import { HandHeartIcon } from "phosphor-react-native/src/icons/HandHeart";
import { HeadsetIcon } from "phosphor-react-native/src/icons/Headset";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { InfoIcon } from "phosphor-react-native/src/icons/Info";
import { LightbulbIcon } from "phosphor-react-native/src/icons/Lightbulb";
import { LockKeyIcon } from "phosphor-react-native/src/icons/LockKey";
import { MonitorPlayIcon } from "phosphor-react-native/src/icons/MonitorPlay";
import { ProhibitIcon } from "phosphor-react-native/src/icons/Prohibit";
import { ShieldCheckIcon } from "phosphor-react-native/src/icons/ShieldCheck";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { TrayArrowDownIcon } from "phosphor-react-native/src/icons/TrayArrowDown";
import { UserIcon } from "phosphor-react-native/src/icons/User";

import { ko } from "@/lib/i18n/ko";
import { PRIVACY_URL, TERMS_URL } from "@/lib/support";

export type SettingAction =
  | "attendanceReward"
  | "adReward"
  | "appLock"
  | "contactBlock"
  | "contact"
  | "suggest"
  | "version";

type SettingLabelKey =
  | `setting.menu.${keyof (typeof ko)["setting"]["menu"]}`
  | `list.${keyof (typeof ko)["list"]}`
  | `legal.${keyof (typeof ko)["legal"]}`;

export type SettingItem = {
  labelKey: SettingLabelKey;
  icon: Icon;
  href?: Href;
  url?: string;
  action?: SettingAction;
  gated?: boolean;
};

export type SettingGroup = {
  key: string;
  items: SettingItem[];
  attendance?: boolean;
};

export const PROFILE_VIEW_HREF = "/activity/profile-view";

export const SECTIONS: SettingGroup[] = [
  {
    key: "profile",
    items: [
      { labelKey: "list.myProfile", icon: UserIcon, href: "/member/me" },
      {
        labelKey: "setting.menu.appLock",
        icon: LockKeyIcon,
        action: "appLock",
      },
      {
        labelKey: "setting.menu.contactBlock",
        icon: AddressBookIcon,
        action: "contactBlock",
      },
    ],
  },
  {
    key: "mine",
    items: [
      { labelKey: "list.likes", icon: HeartIcon, href: "/activity/like" },
      {
        labelKey: "list.favorites",
        icon: StarIcon,
        href: "/activity/favorite",
      },
      {
        labelKey: "list.secretPhotos",
        icon: ImagesIcon,
        href: "/activity/secret-photo",
      },
      {
        labelKey: "list.blocks",
        icon: ProhibitIcon,
        href: "/activity/block",
      },
      {
        labelKey: "list.worries",
        icon: ChatCircleTextIcon,
        href: "/activity/worry",
      },
    ],
  },
  {
    key: "received",
    items: [
      {
        labelKey: "list.likesReceived",
        icon: HandHeartIcon,
        href: "/activity/like-received",
        gated: true,
      },
      {
        labelKey: "list.favoritesReceived",
        icon: TrayArrowDownIcon,
        href: "/activity/favorite-received",
        gated: true,
      },
      {
        labelKey: "list.secretPhotosOpened",
        icon: EyeIcon,
        href: "/activity/secret-photo-opened",
        gated: true,
      },
      {
        labelKey: "list.profileViews",
        icon: FootprintsIcon,
        href: PROFILE_VIEW_HREF,
        gated: true,
      },
    ],
  },
  {
    key: "point",
    attendance: true,
    items: [
      {
        labelKey: "list.pointHistory",
        icon: CoinsIcon,
        href: "/point/history",
      },
      {
        labelKey: "setting.menu.adReward",
        icon: MonitorPlayIcon,
        action: "adReward",
      },
      {
        labelKey: "setting.menu.attendanceReward",
        icon: CalendarCheckIcon,
        action: "attendanceReward",
      },
    ],
  },
  {
    key: "support",
    items: [
      {
        labelKey: "setting.menu.contact",
        icon: HeadsetIcon,
        action: "contact",
      },
      {
        labelKey: "setting.menu.suggest",
        icon: LightbulbIcon,
        action: "suggest",
      },
      { labelKey: "legal.terms", icon: FileTextIcon, url: TERMS_URL },
      {
        labelKey: "legal.privacy",
        icon: ShieldCheckIcon,
        url: PRIVACY_URL,
      },
      { labelKey: "setting.menu.version", icon: InfoIcon, action: "version" },
    ],
  },
];
