import { Text } from "tamagui";

// 상세 화면에서 묶음 위에 붙는 제목이다. TDS ListHeader 제목(t5, 17 굵게, grey800)을 따른다.
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text fontSize="$4" lineHeight="$4" fontWeight="700" color="$grey800">
      {children}
    </Text>
  );
}
