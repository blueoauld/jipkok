import { YStack, type YStackProps } from "tamagui";

import { Text } from "@/components/ui/Text";
import { SCREEN_PADDING } from "@/lib/design";

// TDS ListHeader에서 잰 값이다. 제목은 17 굵게 grey800이고, 좌우는 TDS의 24 대신 앱 화면 여백을 따른다.
const PADDING_TOP = 24;
const PADDING_BOTTOM = 8;

// 상세 화면에서 묶음 위에 붙는 제목이다.
export function ListHeader({
  children,
  ...props
}: Omit<YStackProps, "children"> & { children: string }) {
  return (
    <YStack pt={PADDING_TOP} pb={PADDING_BOTTOM} px={SCREEN_PADDING} {...props}>
      <Text fontSize="$4" lineHeight="$4" fontWeight="700" color="$grey800">
        {children}
      </Text>
    </YStack>
  );
}
