import { useRef, useState } from "react";
import { Dialog, Text, XStack } from "tamagui";

import { RetroButton } from "@/components/ui/RetroButton";
import { RetroFormDialog } from "@/components/ui/RetroFormDialog";
import { RetroInput } from "@/components/ui/RetroInput";

import { FormField } from "./FormField";

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
          <Text theme="gray" color="$color11">
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
  return (
    <RetroFormDialog open={open} onOpenChange={onOpenChange}>
      <DialogForm
        title={title}
        placeholder={placeholder}
        maxLength={maxLength}
        defaultValue={defaultValue}
        submitLabel={submitLabel}
        rows={rows}
        onSubmit={onSubmit}
      />
    </RetroFormDialog>
  );
}
