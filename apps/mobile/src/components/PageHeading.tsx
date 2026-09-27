import { colors } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

export function PageHeading({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: IconName }) {
  return (
    <View style={styles.heading}>
      <View style={styles.top}><AppText variant="labelSm" tone="accent">{eyebrow}</AppText><View style={styles.icon}><Icon name={icon} color={colors.primary} size={22} /></View></View>
      <AppText variant="headlineXl" accessibilityRole="header">{title}</AppText>
      <AppText tone="muted" style={styles.description}>{description}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  heading: { padding: 22, gap: 8, backgroundColor: colors.primarySoft, borderRadius: 26 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#ffffffb3", alignItems: "center", justifyContent: "center" },
  description: { maxWidth: 400, lineHeight: 22 },
});
