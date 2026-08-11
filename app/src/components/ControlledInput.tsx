import type { ComponentType, ReactNode } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import type { InputProps } from "tamagui";

import { FormField } from "@/components/FormField";
import { FormInput } from "@/components/FormInput";

type ControlledInputProps<T extends FieldValues> = InputProps & {
  control: Control<T>;
  name: FieldPath<T>;
  rules?: RegisterOptions<T, FieldPath<T>>;
  renderRight?: (value: string) => ReactNode;
  input?: ComponentType<InputProps>;
};

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  rules,
  renderRight,
  input: InputComponent = FormInput,
  ...inputProps
}: ControlledInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormField
          error={fieldState.error?.message}
          right={renderRight?.(field.value ?? "")}
        >
          <InputComponent
            value={field.value ?? ""}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            {...inputProps}
          />
        </FormField>
      )}
    />
  );
}
