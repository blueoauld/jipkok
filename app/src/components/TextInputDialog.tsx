import { useRef, useState } from "react";
import { Dialog, Text, XStack, YStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { RetroInput } from "@/components/ui/RetroInput";
import { useDialogKeyboardOffset } from "@/hooks/useDialogKeyboardOffset";
import { SHEET_OVERLAY_OPACITY } from "@/lib/design";

import { FormField } from "./FormField";

const SHADOW_OFFSET = 4;

function DialogForm({
  title,
  placeholder,
  maxLength,
  defaultValue,
  submitLabel,
  rows,
  onSubmit,
}: {
  title: string;
  placeholder: string;
  maxLength: number;
  defaultValue: string;
  submitLabel: string;
  rows?: number;
  onSubmit: (value: string) => void;
}) {
  const valueRef = useRef(defaultValue);
  const [length, setLength] = useState(defaultValue.length);

  return (
    <>
      <Dialog.Title fontSize="$6">{title}</Dialog.Title>

      <FormField
        right={
          <Text theme="gray" color="$color10">
            {`${length} / ${maxLength}`}
          </Text>
        }
      >
        <RetroInput
          defaultValue={defaultValue}
          onChangeText={(text) => {
            valueRef.current = text;
            setLength(text.length);
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          multiline={rows !== undefined}
          rows={rows}
          textAlignVertical={rows === undefined ? undefined : "top"}
          submitBehavior={rows === undefined ? "submit" : undefined}
          autoFocusNative
        />
      </FormField>

      <XStack gap="$3">
        <Dialog.Close asChild>
          <RetroButton flex={1} theme="gray">
            닫기
          </RetroButton>
        </Dialog.Close>

        <Dialog.Close asChild>
          <RetroButton flex={1} onPress={() => onSubmit(valueRef.current)}>
            {submitLabel}
          </RetroButton>
        </Dialog.Close>
      </XStack>
    </>
  );
}

export function TextInputDialog({
  open,
  onOpenChange,
  title,
  placeholder,
  maxLength,
  defaultValue = "",
  submitLabel = "작성",
  rows,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  placeholder: string;
  maxLength: number;
  defaultValue?: string;
  submitLabel?: string;
  rows?: number;
  onSubmit: (value: string) => void;
}) {
  const keyboardOffset = useDialogKeyboardOffset();

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay bg="black" opacity={SHEET_OVERLAY_OPACITY} />

        <Dialog.Content
          width="85%"
          maxW={400}
          p={0}
          bg="transparent"
          rounded={0}
          borderWidth={0}
          elevation={0}
          shadowOpacity={0}
          y={keyboardOffset}
        >
          <YStack>
            <YStack
              position="absolute"
              t={SHADOW_OFFSET}
              b={-SHADOW_OFFSET}
              l={SHADOW_OFFSET}
              r={-SHADOW_OFFSET}
              bg="$gray12"
            />
            <YStack
              borderWidth={2}
              borderColor="$color12"
              bg="$color1"
              p="$4"
              gap="$4"
            >
              <DialogForm
                key={String(open)}
                title={title}
                placeholder={placeholder}
                maxLength={maxLength}
                defaultValue={defaultValue}
                submitLabel={submitLabel}
                rows={rows}
                onSubmit={onSubmit}
              />
            </YStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
