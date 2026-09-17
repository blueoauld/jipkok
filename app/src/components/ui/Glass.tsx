import { GlassView, type GlassViewProps } from "expo-glass-effect";

import { useThemeStore } from "@/lib/theme/store";

// 앱이 자체 테마 토글을 갖고 있어 유리가 시스템 외관을 따르면 화면과 어긋난다. 쓰는 쪽마다
// 기억할 일이 아니라서 유리는 전부 이 컴포넌트를 거친다.
export function Glass(props: GlassViewProps) {
  const scheme = useThemeStore((state) => state.mode);

  return <GlassView colorScheme={scheme} {...props} />;
}
