import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { KeyboardTypeOptions } from "react-native";
import { Dialog, XStack } from "tamagui";

import { CountedInput } from "@/components/ui/CountedInput";
import { RetroButton } from "@/components/ui/RetroButton";
import { RetroFormDialog } from "@/components/ui/RetroFormDialog";

function DialogForm({
  title,
  placeholder,
  maxLength,
  defaultValue,
  submitLabel,
  rows,
  clearable,
  keyboardType,
  onSubmit,
}: {
  title: string;
  placeholder: string;
  maxLength: number;
  defaultValue: string;
  submitLabel: string;
  rows?: number;
  clearable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  onSubmit: (value: string) => void;
}) {
  const { t } = useTranslation();
  const valueRef = useRef(defaultValue);

  return (
    <>
      <Dialog.Title fontSize="$6">{title}</Dialog.Title>

      <CountedInput
        valueRef={valueRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        clearable={clearable}
        keyboardType={keyboardType}
        multiline={rows !== undefined}
        rows={rows}
        textAlignVertical={rows === undefined ? undefined : "top"}
        submitBehavior={rows === undefined ? "submit" : undefined}
        autoFocusNative
      />

      <XStack gap="$3">
        <Dialog.Close asChild>
          <RetroButton flex={1} theme="gray">
            {t("component.close")}
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
  submitLabel,
  rows,
  clearable,
  keyboardType,
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
  clearable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  onSubmit: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <RetroFormDialog open={open} onOpenChange={onOpenChange}>
      <DialogForm
        title={title}
        placeholder={placeholder}
        maxLength={maxLength}
        defaultValue={defaultValue}
        submitLabel={submitLabel ?? t("component.submit")}
        rows={rows}
        clearable={clearable}
        keyboardType={keyboardType}
        onSubmit={onSubmit}
      />
    </RetroFormDialog>
  );
}
