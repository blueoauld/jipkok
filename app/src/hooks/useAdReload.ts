import { useCallback, useEffect, useState } from "react";

import { reportError } from "@/lib/crash";

// 채우기 실패(no fill)는 잠시 뒤 풀리는 일이 많아 간격을 늘려 가며 몇 번 더 불러온다.
// 끝없이 반복하면 AdMob이 요청 남용으로 보므로 횟수를 제한한다.
export const AD_RELOAD_DELAYS = [30_000, 60_000, 120_000];

// 라이브러리는 ERROR 이벤트에서 isLoaded를 내리지 않지만 네이티브 객체는 이미 비워 둔다.
// 그 상태로 show()를 부르면 동기적으로 던지므로 준비된 것으로 보지 않는다. 다시 불러오면
// error가 지워져 풀린다.
export function isAdReady(isLoaded: boolean, error: Error | undefined) {
  return isLoaded && error === undefined;
}

export function useAdReload(
  error: Error | undefined,
  load: () => void,
  reportName: string,
) {
  const [failures, setFailures] = useState(0);

  // 기기에서 AdMob에 닿기 전에 실패한 요청은 보고서에 잡히지 않아 사유를 따로 남긴다.
  useEffect(() => {
    if (error) {
      reportError(reportName, error);
    }
  }, [error, reportName]);

  // 마운트, 닫힘, 직접 누름처럼 새로 시작하는 로드는 실패 횟수를 되돌린다.
  const reload = useCallback(() => {
    setFailures(0);
    load();
  }, [load]);

  useEffect(() => {
    const delay = AD_RELOAD_DELAYS[failures];

    if (!error || delay === undefined) {
      return;
    }

    const timer = setTimeout(() => {
      setFailures(failures + 1);
      load();
    }, delay);

    return () => clearTimeout(timer);
  }, [error, failures, load]);

  return {
    reload,
    givenUp: error !== undefined && failures >= AD_RELOAD_DELAYS.length,
  };
}
