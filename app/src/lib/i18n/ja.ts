import type { ko } from "@/lib/i18n/ko";

export const ja: typeof ko = {
  common: {
    profileLoadFailed: "プロフィールを読み込めませんでした。",
    listLoadFailed: "リストを読み込めませんでした。",
    memberEmpty: "会員がいません。",
    profileCommentEmpty: "コメントがありません。",
    profileBioEmpty: "自己紹介がありません。",
    reported: "通報を受け付けました。",
    photoPermission: "写真へのアクセス権限が必要です。",
    codeSent: "認証番号を送信しました。",
  },
  validation: {
    phoneNumberRequired: "携帯電話番号を入力してください。",
    phoneNumberInvalid: "携帯電話番号が正しくありません。",
    codeRequired: "認証番号を入力してください。",
    codeInvalid: "認証番号が正しくありません。",
    passwordRequired: "パスワードを入力してください。",
    passwordLength:
      "パスワードは{{min}}文字以上{{max}}文字以下で入力してください。",
    passwordConfirmRequired: "パスワードをもう一度入力してください。",
    passwordMismatch: "パスワードが一致しません。",
    nicknameRequired: "ニックネームを入力してください。",
    nicknameInvalid: "ニックネームが正しくありません。",
    birthYearRequired: "生年を入力してください。",
    birthYearInvalid: "生年が正しくありません。",
    ageRange: "{{min}}歳以上{{max}}歳以下のみ登録できます。",
  },
  gender: {
    MALE: "男性",
    FEMALE: "女性",
  },
  genderFilter: {
    ALL: "すべて",
    MALE: "男性",
    FEMALE: "女性",
  },
  chat: {
    filter: { ALL: "すべて", UNREAD: "未読" },
    list: {
      errorMessage: "チャットルームを読み込めませんでした。",
      emptyMessage: "チャットルームがありません。",
      unreadEmptyMessage: "未読のチャットルームがありません。",
    },
    search: {
      title: "チャット検索",
      hint: "ニックネームを入力してください。",
    },
  },
  main: {
    sort: { RECENT: "最近", DISTANCE: "距離" },
  },
  lounge: {
    board: { FEED: "フィード", WORRY: "悩み" },
  },
  setting: {
    theme: { blue: "ブルー", pink: "ピンク", dark: "ダーク" },
  },
  rank: {
    errorMessage: "ランキングを読み込めませんでした。",
  },
  point: {
    history: {
      title: "ポイント履歴",
      balance: "保有ポイント",
      errorMessage: "履歴を読み込めませんでした。",
      emptyMessage: "履歴がありません。",
    },
  },
  worry: {
    list: {
      title: "悩みリスト",
      emptyMessage: "投稿した悩みがありません。",
      errorMessage: "悩みを読み込めませんでした。",
    },
    search: {
      title: "悩み検索",
      hint: "内容を{{count}}文字以上入力してください。",
      placeholder: "悩みの内容",
    },
  },
  member: {
    search: {
      title: "会員検索",
      hint: "ニックネームを{{count}}文字以上入力してください。",
    },
  },
  date: {
    justNow: "たった今",
    minutesAgo: "{{count}}分前",
    hoursAgo: "{{count}}時間前",
    daysAgo: "{{count}}日前",
    today: "今日",
    yesterday: "昨日",
    monthDay: "{{month}}月{{day}}日",
    fullDate: "{{year}}/{{month}}/{{day}}",
    yearMonthDay: "{{year}}年{{month}}月{{day}}日",
    clock: "{{meridiem}}{{hour}}:{{minute}}",
    am: "午前",
    pm: "午後",
  },
  pointType: {
    ACCESS_REWARD: "アクセス報酬",
    ATTENDANCE_REWARD: "出席報酬",
    AD_REWARD: "広告報酬",
    NOTE_SEND: "メッセージ送信",
  },
  suspensionReason: {
    SCREEN_CAPTURE: "画面キャプチャ",
    OBSCENITY: "わいせつ物",
    MINOR: "未成年者",
    MONEY_TRANSACTION: "金銭取引",
    ABUSE: "暴言および脅迫",
    IMPERSONATION: "なりすましおよび不正利用",
    ETC: "その他",
  },
  worryCategory: {
    LOVE: "恋愛",
    RELATIONSHIP: "人間関係",
    WORK: "仕事",
    FAMILY: "家族",
    MIND: "こころ",
    LIFE: "日常",
    ETC: "その他",
  },
};
