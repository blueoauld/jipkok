import { Image } from "expo-image";
import type { ImagePickerAsset } from "expo-image-picker";
import type { Icon } from "phosphor-react-native";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme, XStack, YStack } from "tamagui";

import { CARD_RATIO } from "@/components/feed/FeedCard";
import { BottomSheet, BottomSheetButtons } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { CountedInput } from "@/components/ui/CountedInput";
import { PhotoOverlayButton } from "@/components/ui/PhotoOverlayButton";
import {
  CARD_RADIUS,
  COVER_IMAGE_STYLE,
  DARK_FILL,
  SHEET_PADDING_X,
} from "@/lib/design";
import { pickSinglePhoto, takePhoto } from "@/lib/photo/picker";

const CAPTION_MAX_LENGTH = 30;

const PICKER_ICON_SIZE = 40;
const REMOVE_ICON_SIZE = 14;
const REMOVE_BUTTON_INSET = 12;

function PickerTile({
  icon: Icon,
  label,
  onPress,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      flex={1}
      aspectRatio={1}
      rounded={CARD_RADIUS}
      bg="$grey100"
      items="center"
      justify="center"
      pressStyle={{ bg: "$grey200" }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <Icon size={PICKER_ICON_SIZE} color={theme.grey600.val} />
    </YStack>
  );
}

function ComposeForm({
  pending,
  onError,
  onSubmit,
  onClose,
}: {
  pending: boolean;
  onError: (error: unknown) => void;
  onSubmit: (photo: ImagePickerAsset, caption: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const captionRef = useRef("");

  const choose = async (pick: () => Promise<ImagePickerAsset | null>) => {
    try {
      const picked = await pick();

      if (picked) {
        setPhoto(picked);
      }
    } catch (error) {
      onError(error);
    }
  };

  return (
    <>
      <YStack px={SHEET_PADDING_X} gap="$4">
        {photo ? (
          <YStack
            aspectRatio={CARD_RATIO}
            rounded={CARD_RADIUS}
            bg="$grey100"
            overflow="hidden"
          >
            <Image
              source={photo.uri}
              contentFit="cover"
              style={COVER_IMAGE_STYLE}
            />

            <PhotoOverlayButton
              t={REMOVE_BUTTON_INSET}
              r={REMOVE_BUTTON_INSET}
              bg={DARK_FILL}
              label={t("a11y.removePhoto")}
              onPress={() => setPhoto(null)}
            >
              <XIcon
                size={REMOVE_ICON_SIZE}
                weight="bold"
                color={theme.onFill.val}
              />
            </PhotoOverlayButton>
          </YStack>
        ) : (
          <XStack gap="$2">
            <PickerTile
              icon={ImagesIcon}
              label={t("chatRoom.attachAlbum")}
              onPress={() => choose(pickSinglePhoto)}
            />
            <PickerTile
              icon={CameraIcon}
              label={t("chatRoom.attachCamera")}
              onPress={() => choose(takePhoto)}
            />
          </XStack>
        )}

        <CountedInput
          valueRef={captionRef}
          placeholder={t("common.contentPlaceholder")}
          maxLength={CAPTION_MAX_LENGTH}
          submitBehavior="blurAndSubmit"
        />
      </YStack>

      <BottomSheetButtons>
        <Button
          flex={1}
          size="xlarge"
          variant="secondary"
          disabled={pending}
          onPress={onClose}
        >
          {t("feed.composeClose")}
        </Button>

        <Button
          flex={1}
          size="xlarge"
          disabled={!photo}
          loading={pending}
          onPress={() => photo && onSubmit(photo, captionRef.current)}
        >
          {t("feed.composeSubmit")}
        </Button>
      </BottomSheetButtons>
    </>
  );
}

export function FeedComposeSheet({
  open,
  pending,
  onError,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onError: (error: unknown) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (photo: ImagePickerAsset, caption: string) => void;
}) {
  const { t } = useTranslation();

  // 열 때마다 새로 만들어 지난번에 고른 사진과 글이 남지 않게 한다. 닫히는 동안에는 그대로 둔다.
  const [session, setSession] = useState({ open, id: 0 });

  if (session.open !== open) {
    setSession({ open, id: open ? session.id + 1 : session.id });
  }

  // 올리는 중에는 닫히면 결과를 알릴 곳이 없어지므로 어떤 길로도 닫지 않는다.
  const changeOpen = (next: boolean) => !pending && onOpenChange(next);

  return (
    <BottomSheet
      open={open}
      onOpenChange={changeOpen}
      title={t("feed.composeTitle")}
      dismissible={!pending}
      moveOnKeyboardChange
    >
      <ComposeForm
        key={session.id}
        pending={pending}
        onError={onError}
        onSubmit={onSubmit}
        onClose={() => changeOpen(false)}
      />
    </BottomSheet>
  );
}
