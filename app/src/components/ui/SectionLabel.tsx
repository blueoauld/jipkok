import { Text } from "tamagui";

// 폼과 상세 화면에서 묶음 위에 붙는 작은 제목이다. 줄높이를 고정해 옆에 다른 글자가 서도
// 줄이 흔들리지 않는다.
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      theme="gray"
      color="$color11"
      fontSize="$2"
      lineHeight="$2"
      fontWeight="600"
    >
      {children}
    </Text>
  );
}
