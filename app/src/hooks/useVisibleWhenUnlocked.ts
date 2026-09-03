import { useAppLocked } from "@/lib/lock/store";

// iOS는 떠 있는 Modal 위에 다른 Modal을 못 올리므로 잠금 화면이 Modal과 시트를 덮을 수 없다.
// 대신 잠긴 동안 Modal과 시트가 스스로 숨고, 풀리면 원래 상태대로 다시 뜬다.
export function useVisibleWhenUnlocked(visible: boolean) {
  const locked = useAppLocked();

  return visible && !locked;
}
