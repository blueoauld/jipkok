import type { TextProps } from "tamagui";

import { Text } from "@/components/ui/Text";
import { useNow } from "@/hooks/useNow";
import { formatRelativeTime } from "@/lib/date";

export function RelativeTime({ at, ...props }: TextProps & { at: string }) {
  const now = useNow();

  return (
    <Text preset="caption" shrink={0} color="$grey500" {...props}>
      {formatRelativeTime(at, now)}
    </Text>
  );
}
