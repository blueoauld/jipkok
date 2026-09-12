export type TextSegment = { text: string; url?: string };

// http(s)와 www.로 시작하는 것만 링크로 본다. 전화번호와 맨 도메인은 일부러 뺀다.
// 일본어와 중국어는 링크 뒤에 띄어쓰기 없이 문장부호가 붙으므로 처음부터 먹지 않는다.
// TRAILING_PUNCTUATION은 끝에 앵커되어 "…app，謝謝"처럼 뒷말이 이어지면 못 걷어낸다.
// 키보드가 문장 첫 글자를 대문자로 바꾸는 일이 잦아 대소문자는 가리지 않는다.
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"'`，、。！？；：]+/gi;

// 문장 끝의 마침표나 닫는 괄호는 링크의 일부가 아닌 경우가 대부분이다.
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"」』】>]+$/;

function toHref(url: string) {
  return /^www\./i.test(url) ? `https://${url}` : url;
}

function count(text: string, char: string) {
  return text.split(char).length - 1;
}

// 위키처럼 경로에 괄호가 든 링크는 닫는 괄호를 짝이 맞는 만큼 돌려준다.
function restoreClosingParens(raw: string, trailing: string) {
  let url = raw;

  for (const char of trailing) {
    if (char !== ")" || count(url, "(") <= count(url, ")")) {
      break;
    }

    url += ")";
  }

  return url;
}

export function splitLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index;
    const stripped = match[0].replace(TRAILING_PUNCTUATION, "");
    const raw = restoreClosingParens(stripped, match[0].slice(stripped.length));

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
