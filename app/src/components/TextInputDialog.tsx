import { useRef, useState } from "react";
import { Button, Dialog, Text, XStack } from "tamagui";

import { FormField } from "./FormField";
import { FormInput } from "./FormInput";

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
        <FormInput
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

      <XStack gap="$2">
        <Dialog.Close asChild>
          <Button flex={1} size="$4" rounded="$7">
            닫기
          </Button>
        </Dialog.Close>

        <Dialog.Close asChild>
          <Button
            flex={1}
            size="$4"
            theme="blue"
            rounded="$7"
            onPress={() => onSubmit(valueRef.current)}
          >
            {submitLabel}
          </Button>
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
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay opacity={0.6} />

        <Dialog.Content width="85%" maxW={400} p="$4" gap="$4" y={-45}>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
