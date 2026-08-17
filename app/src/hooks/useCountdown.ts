import { useEffect, useState } from "react";

// 남은 초를 돌려주고, 0이 되면 멈춘다. 서버 재전송 쿨다운 같은 짧은 대기 표시용.
export function useCountdown() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (endsAt === null) {
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);

      if (left === 0) {
        setEndsAt(null);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  return {
    remaining,
    start: (seconds: number) => setEndsAt(Date.now() + seconds * 1000),
  };
}
