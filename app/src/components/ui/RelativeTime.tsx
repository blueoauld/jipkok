import { Text, type TextProps } from "tamagui";

import { useNow } from "@/hooks/useNow";
import { formatRelativeTime } from "@/lib/date";

export function RelativeTime({ at, ...props }: TextProps & { at: string }) {
  const now = useNow();

  return (
    <Text theme="gray" shrink={0} fontSize="$2" color="$color11" {...props}>
      {formatRelativeTime(at, now)}
    </Text>
  );
}
