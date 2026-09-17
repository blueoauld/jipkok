import { Text, type TextProps } from "tamagui";

import { useNow } from "@/hooks/useNow";
import { formatRelativeTime } from "@/lib/date";

export function RelativeTime({ at, ...props }: TextProps & { at: string }) {
  const now = useNow();

  return (
    <Text shrink={0} fontSize="$1" color="$grey500" {...props}>
      {formatRelativeTime(at, now)}
    </Text>
  );
}
