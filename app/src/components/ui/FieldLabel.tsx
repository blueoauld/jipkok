import { Text } from "@/components/ui/Text";
import { FIELD_TEXT_INSET } from "@/lib/design";

// 폼에서 입력창이 아닌 컨트롤(사진, 분류, 성별 등) 위에 붙는 라벨이다. TDS 텍스트 필드 라벨(13, 보통 굵기,
// grey800)을 따른다. 컨트롤과의 간격은 쓰는 쪽이 FIELD_TEXT_GAP으로 둔다.
export function FieldLabel({ children }: { children: string }) {
  return (
    <Text preset="note" px={FIELD_TEXT_INSET} color="$grey800">
      {children}
    </Text>
  );
}
