import Svg, { Path } from "react-native-svg";

// TDS 세그먼트 fluid의 왼쪽 꺾쇠다. 오른쪽은 좌우로 뒤집어 쓴다.
const ICON_PATH =
  "m4.069 8c0-.23.087-.46.263-.636l4.5-4.5c.226-.235.561-.331.877-.248.316.082.562.328.644.644.082.315-.012.651-.248.877l-3.864 3.864 3.864 3.864c.235.226.33.562.248.877-.082.316-.328.562-.644.644-.316.083-.651-.013-.877-.248l-4.5-4.5c-.168-.169-.263-.398-.263-.636";

export function ChevronIcon({
  side,
  size,
  color,
}: {
  side: "left" | "right";
  size: number;
  color: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={side === "right" ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Path d={ICON_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
