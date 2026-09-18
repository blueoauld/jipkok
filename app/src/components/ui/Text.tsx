import { styled, Text as TamaguiText } from "tamagui";

// 여러 곳에서 되풀이되는 크기와 굵기 조합에만 이름을 붙였다. 색은 자리마다 달라 담지 않는다.
// Strong 셋과 caption은 배지, 버튼, 사진 위 글자처럼 한 줄짜리라 줄 간격을 주지 않는다.
export const Text = styled(TamaguiText, {
  variants: {
    preset: {
      title: { fontSize: "$6", lineHeight: "$6", fontWeight: "700" },
      // 목록 행의 이름
      label: { fontSize: "$4", lineHeight: "$4", fontWeight: "500" },
      body: { fontSize: "$4", lineHeight: "$4" },
      bodyStrong: { fontSize: "$4", fontWeight: "600" },
      // 본문 아래 보조 설명
      sub: { fontSize: "$2", lineHeight: "$2" },
      subStrong: { fontSize: "$2", fontWeight: "600" },
      // 작은 안내
      note: { fontSize: "$1", lineHeight: "$1" },
      // 시각, 거리, 개수
      caption: { fontSize: "$1" },
      captionStrong: { fontSize: "$1", fontWeight: "600" },
    },
  } as const,
});
