import { YStack, type YStackProps } from "tamagui";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { SCREEN_PADDING } from "@/lib/design";

// TDS ListHeader에서 잰 위아래 여백이다. 좌우는 TDS의 24 대신 앱 화면 여백을 따른다.
const PADDING_TOP = 24;
const PADDING_BOTTOM = 8;

export function ListHeader({
  children,
  ...props
}: Omit<YStackProps, "children"> & { children: string }) {
  return (
    <YStack pt={PADDING_TOP} pb={PADDING_BOTTOM} px={SCREEN_PADDING} {...props}>
      <SectionLabel>{children}</SectionLabel>
    </YStack>
  );
}
