import { router, type Href } from "expo-router";

// 화면이 뜨기 전에 같은 곳을 또 누르면 같은 화면이 겹쳐 열린다.
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
