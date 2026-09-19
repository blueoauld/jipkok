import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Image } from "react-native";
import {
  type NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaAspectRatio,
  NativeMediaView,
} from "react-native-google-mobile-ads";
import { XStack, YStack } from "tamagui";

import { AdCallToAction } from "@/components/ad/AdCallToAction";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import {
  PHOTO_TILE_RADIUS,
  SCREEN_PADDING,
  SQUARE_IMAGE_RADIUS_RATIO,
} from "@/lib/design";

const ICON_SIZE = 20;

const ICON_STYLE = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  borderRadius: ICON_SIZE * SQUARE_IMAGE_RADIUS_RATIO,
};

const THUMBNAIL_SIZE = 120;

const THUMBNAIL_STYLE = { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE };

export const WORRY_AD_ASPECT = NativeMediaAspectRatio.SQUARE;

function Item({ ad }: { ad: NativeAd }) {
  const { t } = useTranslation();

  return (
    <Card mt={SCREEN_PADDING}>
      <NativeAdView nativeAd={ad}>
        <YStack gap="$2.5">
          <XStack items="center" gap="$2">
            {ad.icon && (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: ad.icon.url }} style={ICON_STYLE} />
              </NativeAsset>
            )}
            {ad.advertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text
                  fontSize="$2"
                  lineHeight="$2"
                  fontWeight="600"
                  color="$grey800"
                  numberOfLines={1}
                  shrink={1}
                >
                  {ad.advertiser}
                </Text>
              </NativeAsset>
            ) : null}
            <Badge size="xsmall" tone="elephant-weak">
              {t("common.ad")}
            </Badge>
          </XStack>

          <XStack gap="$3" items="flex-start">
            <YStack flex={1} gap="$1.5" items="flex-start">
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text preset="bodyStrong" lineHeight="$4" numberOfLines={2}>
                  {ad.headline}
                </Text>
              </NativeAsset>
              {ad.body ? (
                <NativeAsset assetType={NativeAssetType.BODY}>
                  <Text preset="sub" numberOfLines={2} color="$grey600">
                    {ad.body}
                  </Text>
                </NativeAsset>
              ) : null}
              <AdCallToAction label={ad.callToAction} mt="$1.5" />
            </YStack>

            {ad.mediaContent && (
              <YStack
                rounded={PHOTO_TILE_RADIUS}
                overflow="hidden"
                bg="$grey100"
              >
                <NativeMediaView resizeMode="contain" style={THUMBNAIL_STYLE} />
              </YStack>
            )}
          </XStack>
        </YStack>
      </NativeAdView>
    </Card>
  );
}

export const WorryAdCard = memo(Item);
