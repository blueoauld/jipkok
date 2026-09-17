import { Image } from "expo-image";
import type { ImagePickerAsset } from "expo-image-picker";
import type { Icon } from "phosphor-react-native";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, useTheme, XStack, YStack } from "tamagui";

import { CARD_RATIO } from "@/components/feed/FeedCard";
import { Button } from "@/components/ui/Button";
import { CountedInput } from "@/components/ui/CountedInput";
import { FormDialog, FormDialogTitle } from "@/components/ui/FormDialog";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroPressable } from "@/components/ui/RetroPressable";
import {
  COVER_IMAGE_STYLE,
  DIALOG_BUTTON_GAP,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET_SM,
} from "@/lib/design";
import { pickSinglePhoto, takePhoto } from "@/lib/photo/picker";

const CAPTION_MAX_LENGTH = 30;

const PICKER_ICON_SIZE = 40;
const REMOVE_BUTTON_SIZE = 24;
const REMOVE_ICON_SIZE = 14;

function PickerTile({
  icon: Icon,
  onPress,
}: {
  icon: Icon;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <RetroCard
      flex={1}
      p={0}
      aspectRatio={1}
      items="center"
      justify="center"
      onPress={onPress}
    >
      <Icon size={PICKER_ICON_SIZE} color={theme.color12.val} />
    </RetroCard>
  );
}

function ComposeForm({
  pending,
  onError,
  onSubmit,
}: {
  pending: boolean;
  onError: (error: unknown) => void;
  onSubmit: (photo: ImagePickerAsset, caption: string) => void;
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
      <FormDialogTitle>{t("feed.composeTitle")}</FormDialogTitle>

      {photo ? (
        <YStack
          aspectRatio={CARD_RATIO}
          rounded={0}
          borderWidth={RETRO_BORDER_WIDTH}
          borderColor="$gray12"
          bg="$gray12"
          overflow="hidden"
        >
          <Image
            source={photo.uri}
            contentFit="cover"
            style={COVER_IMAGE_STYLE}
          />

          <YStack position="absolute" t="$3" r="$3">
            <RetroPressable
              offset={RETRO_SHADOW_OFFSET_SM}
              width={REMOVE_BUTTON_SIZE}
              height={REMOVE_BUTTON_SIZE}
              rounded={0}
              bg="$red10"
              items="center"
              justify="center"
              onPress={() => setPhoto(null)}
            >
              <XIcon
                size={REMOVE_ICON_SIZE}
                weight="bold"
                color={theme.onFill.val}
              />
            </RetroPressable>
          </YStack>
        </YStack>
      ) : (
        <XStack gap="$2">
          <PickerTile
            icon={ImagesIcon}
            onPress={() => choose(pickSinglePhoto)}
          />
          <PickerTile icon={CameraIcon} onPress={() => choose(takePhoto)} />
        </XStack>
      )}

      <CountedInput
        valueRef={captionRef}
        placeholder={t("common.contentPlaceholder")}
        maxLength={CAPTION_MAX_LENGTH}
        submitBehavior="submit"
        autoFocusNative
      />

      <XStack gap={DIALOG_BUTTON_GAP}>
        <Dialog.Close asChild>
          <Button flex={1} variant="secondary" disabled={pending}>
            {t("feed.composeClose")}
          </Button>
        </Dialog.Close>

        <Button
          flex={1}
          disabled={!photo}
          loading={pending}
          onPress={() => photo && onSubmit(photo, captionRef.current)}
        >
          {t("feed.composeSubmit")}
        </Button>
      </XStack>
    </>
  );
}

export function FeedComposeDialog({
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
  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <ComposeForm pending={pending} onError={onError} onSubmit={onSubmit} />
    </FormDialog>
  );
}
