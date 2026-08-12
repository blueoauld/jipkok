import { Image } from "expo-image";
import type { ImagePickerAsset } from "expo-image-picker";
import type { Icon } from "phosphor-react-native";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { ImagesIcon } from "phosphor-react-native/src/icons/Images";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { useRef, useState } from "react";
import { Dialog, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

import { CARD_RATIO } from "@/components/FeedCard";
import { FormField } from "@/components/FormField";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroDialogContent } from "@/components/ui/RetroDialogContent";
import { RetroInput } from "@/components/ui/RetroInput";
import { RetroShadow } from "@/components/ui/RetroShadow";
import { useDialogKeyboardOffset } from "@/hooks/useDialogKeyboardOffset";
import { pickSinglePhoto, takePhoto } from "@/hooks/usePhotos";
import { DISABLED_OPACITY, RETRO_SHADOW_OFFSET_SM } from "@/lib/design";

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
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const captionRef = useRef("");
  const [length, setLength] = useState(0);

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
      <Dialog.Title fontSize="$6">피드</Dialog.Title>

      {photo ? (
        <YStack
          aspectRatio={CARD_RATIO}
          rounded={0}
          borderWidth={2}
          borderColor="$color12"
          overflow="hidden"
        >
          <Image source={photo.uri} contentFit="cover" style={{ flex: 1 }} />

          <YStack position="absolute" t="$3" r="$3">
            <RetroShadow color="$gray12" offset={RETRO_SHADOW_OFFSET_SM} />
            <XStack
              width={REMOVE_BUTTON_SIZE}
              height={REMOVE_BUTTON_SIZE}
              rounded={0}
              borderWidth={2}
              borderColor="$gray12"
              bg="$red10"
              items="center"
              justify="center"
              pressStyle={{
                x: RETRO_SHADOW_OFFSET_SM,
                y: RETRO_SHADOW_OFFSET_SM,
              }}
              onPress={() => setPhoto(null)}
            >
              <XIcon size={REMOVE_ICON_SIZE} weight="bold" color="white" />
            </XStack>
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

      <FormField
        right={
          <Text theme="gray" color="$color11">
            {`${length} / ${CAPTION_MAX_LENGTH}`}
          </Text>
        }
      >
        <RetroInput
          onChangeText={(text) => {
            captionRef.current = text;
            setLength(text.length);
          }}
          placeholder="내용 입력"
          maxLength={CAPTION_MAX_LENGTH}
          submitBehavior="submit"
          autoFocusNative
        />
      </FormField>

      <XStack gap="$3">
        <Dialog.Close asChild>
          <RetroButton
            flex={1}
            theme="gray"
            opacity={pending ? DISABLED_OPACITY : 1}
          >
            닫기
          </RetroButton>
        </Dialog.Close>

        <RetroButton
          flex={1}
          disabled={!photo || pending}
          opacity={!photo || pending ? DISABLED_OPACITY : 1}
          onPress={() => photo && onSubmit(photo, captionRef.current)}
        >
          {pending ? <Spinner size="small" color="white" /> : "작성"}
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
  const keyboardOffset = useDialogKeyboardOffset();

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <RetroDialogContent y={keyboardOffset}>
        <ComposeForm
          key={String(open)}
          pending={pending}
          onError={onError}
          onSubmit={onSubmit}
        />
      </RetroDialogContent>
    </Dialog>
  );
}
