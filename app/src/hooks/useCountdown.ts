import { useEffect, useState } from "react";

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
