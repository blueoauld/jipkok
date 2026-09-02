import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { useTranslation } from "react-i18next";
import { YStack, type YStackProps } from "tamagui";

import { PhotoPager } from "@/components/photo/PhotoPager";
import { PhotoGrid } from "@/components/PhotoGrid";
import { RetroFloatingButton } from "@/components/ui/RetroFloatingButton";
import { SCROLL_TO_TOP_SIDE_GAP } from "@/lib/design";

const GRID_ICON_SIZE = 20;

export function ProfilePhotos({
  photos,
  secretFrom,
  gridOpen,
  onPressPhoto,
  pt,
}: {
  photos: string[];
  secretFrom?: number;
  gridOpen: boolean;
  onPressPhoto: (index: number) => void;
  pt?: YStackProps["pt"];
}) {
  return gridOpen ? (
    <YStack px="$4" pt={pt}>
      <PhotoGrid
        photos={photos}
        showPlaceholders
        secretFrom={secretFrom}
        onPressPhoto={onPressPhoto}
      />
    </YStack>
  ) : (
    <PhotoPager photos={photos} secretFrom={secretFrom} />
  );
}

export function PhotoGridToggle({
  open,
  bottom,
  onPress,
}: {
  open: boolean;
  bottom: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <YStack position="absolute" r={SCROLL_TO_TOP_SIDE_GAP} b={bottom}>
      <RetroFloatingButton label={t("a11y.photoGrid")} onPress={onPress}>
        <SquaresFourIcon
          size={GRID_ICON_SIZE}
          weight={open ? "fill" : "regular"}
          color="white"
        />
      </RetroFloatingButton>
    </YStack>
  );
}
