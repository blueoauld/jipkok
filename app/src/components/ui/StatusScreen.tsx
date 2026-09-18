import type { ReactNode } from "react";
import { YStack } from "tamagui";

import { Text } from "@/components/ui/Text";

// 아이콘, 제목, 설명, 버튼이 세로로 놓이는 전체 화면 안내. 잠금, 정지, 오류 화면이 쓴다.
export function StatusScreen({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <YStack flex={1} justify="center" items="center" gap="$5" p="$6">
      {icon}

      <YStack gap="$2" items="center">
        <Text preset="title" text="center">
          {title}
        </Text>

        {description}
      </YStack>

      {children}
    </YStack>
  );
}

export function StatusDescription({ children }: { children: ReactNode }) {
  return (
    <Text preset="body" color="$grey600" text="center">
      {children}
    </Text>
  );
}
