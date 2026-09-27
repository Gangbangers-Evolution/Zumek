import { colors } from "@zumek/design-tokens";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Image, Platform, StyleSheet, View, type ViewProps } from "react-native";
import { useDecorativeMotion } from "../../components/useDecorativeMotion";

const artwork = {
  hello: require("../../../assets/images/chat/reply-transparent.png"),
  thinking: require("../../../assets/images/chat/thinking-transparent.png"),
  cooking: require("../../../assets/images/chat/cooking-transparent.png"),
};

export function MessageEntrance({ children, style, ...props }: ViewProps & { children: ReactNode }) {
  const enabled = useDecorativeMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const played = useRef(false);
  useEffect(() => {
    if (!enabled || played.current) return;
    played.current = true;
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" });
    animation.start();
    return () => { animation.stop(); progress.setValue(1); };
  }, [enabled, progress]);
  return <Animated.View {...props} style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>{children}</Animated.View>;
}

export function ChatMascot({ state = "hello", size = 140, animate = true }: { state?: keyof typeof artwork; size?: number; animate?: boolean }) {
  const enabled = useDecorativeMotion();
  const motion = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    motion.setValue(0);
    if (!enabled || !animate) return;
    const duration = state === "thinking" ? 850 : 1500;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web", isInteraction: false }),
      Animated.timing(motion, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web", isInteraction: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [enabled, animate, state, motion]);
  return (
    <View accessible={false} style={{ width: size, height: size }}>
      <Animated.View style={{ transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }, { rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] }) }] }}>
        <Image source={artwork[state]} accessible={false} resizeMode="contain" style={{ width: size, height: size }} />
      </Animated.View>
    </View>
  );
}

export function ThinkingDots() {
  const enabled = useDecorativeMotion();
  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  useEffect(() => {
    dots.forEach((dot) => dot.setValue(0));
    if (!enabled) return;
    const animation = Animated.loop(Animated.stagger(150, dots.map((dot) => Animated.sequence([
      Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== "web", isInteraction: false }),
      Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== "web", isInteraction: false }),
    ]))));
    animation.start();
    return () => animation.stop();
  }, [enabled, dots]);
  return <View style={styles.dots} accessible={false}>{dots.map((dot, index) => <Animated.View key={index} style={[styles.dot, { opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }), transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />)}</View>;
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", gap: 5, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
});
