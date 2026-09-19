import { NativeAsset, NativeAssetType } from "react-native-google-mobile-ads";
import { XStack, type XStackProps } from "tamagui";

import { Text } from "@/components/ui/Text";
import { BUTTON_SIZES } from "@/lib/design";

const SIZE = BUTTON_SIZES.small;

export function AdCallToAction({
  label,
  ...props
}: XStackProps & { label: string }) {
  return (
    <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
      <XStack
        collapsable={false}
        shrink={0}
        minH={SIZE.height}
        minW={SIZE.minWidth}
        px={SIZE.paddingX}
        rounded={SIZE.radius}
        bg="$greyOpacity100"
        items="center"
        justify="center"
        {...props}
      >
        <Text fontSize={SIZE.fontSize} fontWeight="600" color="$grey700">
          {label}
        </Text>
      </XStack>
    </NativeAsset>
  );
}
