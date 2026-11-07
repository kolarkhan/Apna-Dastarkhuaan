import { Search, X } from "lucide-react-native";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

interface SearchBarProps extends TextInputProps {
  onClear?: () => void;
}

export function SearchBar({ value, onClear, placeholder = "Search biryani, karahi, kitchen...", ...props }: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-2xl bg-neutral-100 px-4" style={{ height: 52 }}>
      <Search size={20} color="#8A8177" />
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#8A8177"
        className="ml-3 flex-1 text-base text-neutral-900"
        returnKeyType="search"
        {...props}
      />
      {value ? (
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Clear search">
          <X size={18} color="#8A8177" />
        </Pressable>
      ) : null}
    </View>
  );
}
