import { forwardRef, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderClass = error ? "border-danger-500" : focused ? "border-primary-500" : "border-neutral-200";

    return (
      <View className="w-full">
        {label ? <Text className="mb-1.5 text-sm font-semibold text-neutral-700">{label}</Text> : null}
        <View
          className={`flex-row items-center rounded-xl border bg-neutral-50 px-4 ${borderClass}`}
          style={{ minHeight: 52 }}
        >
          {leftIcon}
          <TextInput
            ref={ref}
            placeholderTextColor="#AFA79B"
            className="flex-1 text-base text-neutral-900"
            style={{ paddingVertical: 14, marginLeft: leftIcon ? 8 : 0 }}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon}
        </View>
        {error ? (
          <Text className="mt-1.5 text-xs text-danger-600">{error}</Text>
        ) : helperText ? (
          <Text className="mt-1.5 text-xs text-neutral-500">{helperText}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = "Input";
