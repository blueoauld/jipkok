import { SquaresFourIcon } from "phosphor-react-native/src/icons/SquaresFour";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme, YStack } from "tamagui";

import { PhotoPager } from "@/components/photo/PhotoPager";
import { PhotoViewer } from "@/components/photo/PhotoViewer";
import { PhotoGrid } from "@/components/PhotoGrid";
import { CircleButton } from "@/components/ui/CircleButton";
import { SCREEN_PADDING } from "@/lib/design";
import { usePhotoGridStore } from "@/lib/photo/grid-store";

const GRID_ICON_SIZE = 22;

export function ProfilePhotos({
  photos,
  secretFrom,
}: {
  photos: string[];
  secretFrom?: number;
}) {
  const gridOpen = usePhotoGridStore((state) => state.open);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <>
      {gridOpen ? (
        <YStack px={SCREEN_PADDING} pt={SCREEN_PADDING}>
          <PhotoGrid
            photos={photos}
            showPlaceholders
            secretFrom={secretFrom}
            onPressPhoto={setViewerIndex}
          />
        </YStack>
      ) : (
        <PhotoPager photos={photos} secretFrom={secretFrom} />
      )}

      <PhotoViewer
        photos={photos}
        initialIndex={viewerIndex ?? 0}
        open={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

export function PhotoGridToggle() {
  const { t } = useTranslation();
  const theme = useTheme();
  const open = usePhotoGridStore((state) => state.open);
  const toggle = usePhotoGridStore((state) => state.toggle);

  return (
    <CircleButton
      tone="translucentBlue"
      label={t("a11y.photoGrid")}
      onPress={toggle}
    >
      <SquaresFourIcon
        size={GRID_ICON_SIZE}
        weight={open ? "fill" : "regular"}
        color={theme.onFill.val}
      />
    </CircleButton>
  );
}
