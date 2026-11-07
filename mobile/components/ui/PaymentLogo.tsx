import { Landmark } from "lucide-react-native";
import { Text, View } from "react-native";

/**
 * Brand-colored wordmark badges for payment methods — not scraped logo
 * files (no verified, freely-licensed official artwork was available),
 * but styled to read clearly as each brand rather than a generic icon.
 */

export function EasypaisaLogo({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#39B54A" }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.21 }} className="font-extrabold text-white" numberOfLines={1}>
        easy
      </Text>
      <Text style={{ fontSize: size * 0.21, marginTop: -size * 0.04 }} className="font-extrabold text-white" numberOfLines={1}>
        paisa
      </Text>
    </View>
  );
}

export function JazzCashLogo({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#ED1C24" }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.22 }} className="font-extrabold text-white" numberOfLines={1}>
        Jazz
      </Text>
      <Text style={{ fontSize: size * 0.22, marginTop: -size * 0.04 }} className="font-extrabold text-white" numberOfLines={1}>
        Cash
      </Text>
    </View>
  );
}

export function BankTransferLogo({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#332F2A" }}
      className="items-center justify-center"
    >
      <Landmark size={size * 0.45} color="#fff" />
    </View>
  );
}
