import { useEffect, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";
import { useDecorativeMotion } from "../../components/useDecorativeMotion";

/** Flotación leve para la ilustración del presupuesto. */
export function BudgetMascot() {
  const enabled = useDecorativeMotion();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    float.setValue(0);
    if (!enabled) return;
    const driver = Platform.OS !== "web";
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: driver, isInteraction: false }),
      Animated.timing(float, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: driver, isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [enabled, float]);

  return (
    <Animated.Image
      source={require("../../../assets/images/brand/budget-mascot.png")}
      resizeMode="contain"
      accessible={false}
      style={{
        width: 88,
        height: 88,
        transform: [
          { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [3, -5] }) },
          { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] }) },
        ],
      }}
    />
  );
}
