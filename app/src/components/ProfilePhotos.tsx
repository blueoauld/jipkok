import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { useTranslation } from "react-i18next";
import { useTheme, YStack } from "tamagui";

import { PhotoPager } from "@/components/photo/PhotoPager";
import { PhotoGrid } from "@/components/PhotoGrid";
import { FloatingButton } from "@/components/ui/FloatingButton";
import { SCREEN_PADDING, SCROLL_TO_TOP_SIDE_GAP } from "@/lib/design";
import { GLASS_ENABLED, usePhotoGlass } from "@/lib/glass";

const GRID_ICON_SIZE = 22;

export function ProfilePhotos({
  photos,
  secretFrom,
  gridOpen,
  onPressPhoto,
}: {
  photos: string[];
  secretFrom?: number;
  gridOpen: boolean;
  onPressPhoto: (index: number) => void;
}) {
  return gridOpen ? (
    <YStack px={SCREEN_PADDING} pt={SCREEN_PADDING}>
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
  const theme = useTheme();
  const photoGlass = usePhotoGlass();

  return (
    <YStack position="absolute" r={SCROLL_TO_TOP_SIDE_GAP} b={bottom}>
      <FloatingButton label={t("a11y.photoGrid")} overPhoto onPress={onPress}>
        <SquaresFourIcon
          size={GRID_ICON_SIZE}
          weight={open ? "fill" : "regular"}
          color={GLASS_ENABLED ? photoGlass.ink : theme.onFill.val}
        />
      </FloatingButton>
    </YStack>
  );
}
