import { router, type Href } from "expo-router";

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
