export type TextSegment = { text: string; url?: string };

// http(s)와 www.로 시작하는 것만 링크로 본다. 전화번호와 맨 도메인은 일부러 뺀다.
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'`]+/g;

// 문장 끝의 마침표나 닫는 괄호는 링크의 일부가 아닌 경우가 대부분이다.
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"」』】>]+$/;

function toHref(url: string) {
  return url.startsWith("www.") ? `https://${url}` : url;
}

export function splitLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index;
    const raw = match[0].replace(TRAILING_PUNCTUATION, "");

    if (raw.length === 0) {
      continue;
    }

    if (start > last) {
      segments.push({ text: text.slice(last, start) });
    }

    segments.push({ text: raw, url: toHref(raw) });
    last = start + raw.length;
  }

  if (last < text.length) {
    segments.push({ text: text.slice(last) });
  }

  return segments;
}
