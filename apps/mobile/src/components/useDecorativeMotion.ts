import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";

/** Animaciones decorativas solo mientras la pantalla está visible y el SO las permite. */
export function useDecorativeMotion() {
  const [reduced, setReduced] = useState(true);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === "active");
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduced(value); });
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    const app = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  return focused && active && !reduced;
}
