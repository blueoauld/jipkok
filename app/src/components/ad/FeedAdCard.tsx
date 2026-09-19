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

const ICON_SIZE = 40;

const ICON_STYLE = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  borderRadius: ICON_SIZE * SQUARE_IMAGE_RADIUS_RATIO,
};

const LANDSCAPE_RATIO = 1.91;

export const FEED_AD_ASPECT = NativeMediaAspectRatio.LANDSCAPE;

function Item({ ad }: { ad: NativeAd }) {
  const { t } = useTranslation();

  return (
    <Card mt={SCREEN_PADDING}>
      <NativeAdView nativeAd={ad}>
        <YStack gap="$3">
          {ad.mediaContent && (
            <YStack rounded={PHOTO_TILE_RADIUS} overflow="hidden" bg="$grey100">
              <NativeMediaView
                resizeMode="contain"
                style={{
                  width: "100%",
                  aspectRatio: Math.max(
                    ad.mediaContent.aspectRatio,
                    LANDSCAPE_RATIO,
                  ),
                }}
              />
            </YStack>
          )}

          <XStack items="center" gap="$2.5">
            {ad.icon && (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <Image source={{ uri: ad.icon.url }} style={ICON_STYLE} />
              </NativeAsset>
            )}

            <YStack flex={1} gap="$1.5">
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text preset="bodyStrong" numberOfLines={1}>
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

            <AdCallToAction label={ad.callToAction} />
          </XStack>
        </YStack>
      </NativeAdView>
    </Card>
  );
}

export const FeedAdCard = memo(Item);
