import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";
import {
  type NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
} from "react-native-google-mobile-ads";
import { XStack, YStack } from "tamagui";

import { AdCallToAction } from "@/components/ad/AdCallToAction";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import {
  CARD_RADIUS,
  LIST_ROW_EVEN_PADDING_Y,
  LIST_ROW_PADDING_X,
  SQUARE_IMAGE_RADIUS_RATIO,
} from "@/lib/design";

const ICON_SIZE = 40;

const ICON_STYLE = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  borderRadius: ICON_SIZE * SQUARE_IMAGE_RADIUS_RATIO,
};

const AD_CHOICES_INSET = 6;

const CONTENT_PADDING = 10;

function Item({ ad, atTop = false }: { ad: NativeAd; atTop?: boolean }) {
  const { t } = useTranslation();

  return (
    <YStack
      px={LIST_ROW_PADDING_X.small}
      pt={atTop ? LIST_ROW_PADDING_X.small : LIST_ROW_EVEN_PADDING_Y}
      pb={LIST_ROW_EVEN_PADDING_Y}
    >
      <YStack p={AD_CHOICES_INSET} rounded={CARD_RADIUS} bg="$grey100">
        <NativeAdView nativeAd={ad}>
          <XStack p={CONTENT_PADDING} items="center" gap="$2.5">
            {ad.icon && (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: ad.icon.url }} style={ICON_STYLE} />
              </NativeAsset>
            )}

            <YStack flex={1} gap="$1">
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text preset="label" numberOfLines={1} color="$grey800">
                  {ad.headline}
                </Text>
              </NativeAsset>

              <XStack items="center" gap="$2">
                <Badge size="xsmall" tone="elephant-weak">
                  {t("common.ad")}
                </Badge>
                {ad.advertiser ? (
                  <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                    <Text
                      preset="caption"
                      numberOfLines={1}
                      shrink={1}
                      color="$grey500"
                    >
                      {ad.advertiser}
                    </Text>
                  </NativeAsset>
                ) : null}
              </XStack>
            </YStack>

            <AdCallToAction label={ad.callToAction} bg="$layeredBackground" />
          </XStack>
        </NativeAdView>
      </YStack>
    </YStack>
  );
}

export const RowListAdCard = memo(Item);
