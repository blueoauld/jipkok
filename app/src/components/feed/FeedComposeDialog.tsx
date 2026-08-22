import { Image } from "expo-image";
import type { ImagePickerAsset } from "expo-image-picker";
import type { Icon } from "phosphor-react-native";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Spinner, useTheme, XStack, YStack } from "tamagui";

import { CARD_RATIO } from "@/components/feed/FeedCard";
import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroFormDialog } from "@/components/ui/RetroFormDialog";
import { RetroPressable } from "@/components/ui/RetroPressable";
import { pickSinglePhoto, takePhoto } from "@/hooks/usePhotos";
import {
  COVER_IMAGE_STYLE,
  RETRO_BORDER_WIDTH,
  RETRO_SHADOW_OFFSET_SM,
} from "@/lib/design";

const CAPTION_MAX_LENGTH = 30;

const PICKER_ICON_SIZE = 36;
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
      <Dialog.Title fontSize="$6">{t("feed.composeTitle")}</Dialog.Title>

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
              <XIcon size={REMOVE_ICON_SIZE} weight="bold" color="white" />
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
        placeholder={t("feed.composePlaceholder")}
        maxLength={CAPTION_MAX_LENGTH}
        submitBehavior="submit"
        autoFocusNative
      />

      <XStack gap="$3">
        <Dialog.Close asChild>
          <RetroButton flex={1} theme="gray" disabled={pending}>
            {t("feed.composeClose")}
          </RetroButton>
        </Dialog.Close>

        <RetroButton
          flex={1}
          disabled={!photo || pending}
          onPress={() => photo && onSubmit(photo, captionRef.current)}
        >
          {pending ? (
            <Spinner size="small" color="white" />
          ) : (
            t("feed.composeSubmit")
          )}
        </RetroButton>
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
    <RetroFormDialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <ComposeForm pending={pending} onError={onError} onSubmit={onSubmit} />
    </RetroFormDialog>
  );
}
