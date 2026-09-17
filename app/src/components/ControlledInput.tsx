import type { ReactNode } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";

import { FormField } from "@/components/FormField";
import { Input, type InputProps } from "@/components/ui/Input";

type ControlledInputProps<T extends FieldValues> = InputProps & {
  control: Control<T>;
  name: FieldPath<T>;
  rules?: RegisterOptions<T, FieldPath<T>>;
  renderRight?: (value: string) => ReactNode;
};

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  rules,
  renderRight,
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
          <Input
            value={field.value ?? ""}
            error={fieldState.error !== undefined}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            {...inputProps}
          />
        </FormField>
      )}
    />
  );
}
