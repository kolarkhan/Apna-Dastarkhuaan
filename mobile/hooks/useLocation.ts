import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

import { useUiStore } from "@/store/uiStore";

interface LocationState {
  coords: { lat: number; lng: number } | null;
  loading: boolean;
  permissionDenied: boolean;
  refresh: () => Promise<void>;
}

// Lahore, Pakistan — used only if the user denies location permission, so the
// app is still fully browsable rather than stuck on an empty state.
const FALLBACK_LOCATION = { lat: 31.5204, lng: 74.3587 };

export function useLocation(): LocationState {
  const lastKnown = useUiStore((s) => s.lastKnownLocation);
  const setLastKnownLocation = useUiStore((s) => s.setLastKnownLocation);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(lastKnown);
  const [loading, setLoading] = useState(!lastKnown);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        setCoords((prev) => prev ?? FALLBACK_LOCATION);
        return;
      }
      setPermissionDenied(false);
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(next);
      setLastKnownLocation(next);
    } catch {
      setCoords((prev) => prev ?? FALLBACK_LOCATION);
    } finally {
      setLoading(false);
    }
  }, [setLastKnownLocation]);

  useEffect(() => {
    if (!lastKnown) {
      refresh();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, loading, permissionDenied, refresh };
}
