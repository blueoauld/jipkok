import { type Href, router } from "expo-router";

// 앱 스택과 탭마다 둔 스택이 같은 헤더를 그리게 한다.
export const STACK_SCREEN_OPTIONS = {
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
  headerTitleAlign: "center",
} as const;

const DUPLICATE_WINDOW = 700;

let lastHref: string | null = null;
let lastPushedAt = 0;

export function pushOnce(href: Href) {
  const key = typeof href === "string" ? href : JSON.stringify(href);
  const now = Date.now();

  if (key === lastHref && now - lastPushedAt < DUPLICATE_WINDOW) {
    return;
  }

  lastHref = key;
  lastPushedAt = now;

  router.push(href);
}
