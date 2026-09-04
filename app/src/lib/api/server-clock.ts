let offsetMillis = 0;

// 임시 말풍선의 시각을 기기 시계로 찍으면 서버 응답으로 바뀔 때 분이 튄다. 응답의 Date
// 헤더로 두 시계의 차이를 기억해 두고 서버 기준으로 찍는다. 헤더는 초 단위라 분 표시엔 충분하다.
export function rememberServerTime(response: Response) {
  const header = response.headers.get("Date");
  const serverTime = header ? Date.parse(header) : Number.NaN;

  if (Number.isNaN(serverTime)) {
    return;
  }

  offsetMillis = serverTime - Date.now();
}

export function serverNow() {
  return new Date(Date.now() + offsetMillis);
}
