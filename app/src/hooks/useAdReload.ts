import { useCallback, useEffect, useState } from "react";

// 채우기 실패(no fill)는 잠시 뒤 풀리는 일이 많아 간격을 늘려 가며 몇 번 더 불러온다.
// 끝없이 반복하면 AdMob이 요청 남용으로 보므로 횟수를 제한한다.
export const AD_RELOAD_DELAYS = [30_000, 60_000, 120_000];

export function useAdReload(error: Error | undefined, load: () => void) {
  const [failures, setFailures] = useState(0);

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
