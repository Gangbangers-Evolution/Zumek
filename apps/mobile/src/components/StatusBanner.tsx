import type { PlanStatus } from "@zumek/domain";
import { colors, spacing } from "@zumek/design-tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { STATUS_COPY } from "../lib/labels";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { Icon, type IconName } from "./Icon";

const look: Record<PlanStatus, { tone: "savings" | "warning" | "danger"; icon: IconName; fg: string }> = {
  ok: { tone: "savings", icon: "checkCircle", fg: colors.onSecondaryContainer },
  over_budget_close: { tone: "warning", icon: "warning", fg: colors.onTertiaryFixed },
  infeasible_likely: { tone: "danger", icon: "warning", fg: colors.onErrorContainer },
};

export function StatusBanner({ status, children }: { status: PlanStatus; children?: ReactNode }) {
  const { tone, icon, fg } = look[status];
  const copy = STATUS_COPY[status];
  return (
    <Card tone={tone}>
      <View style={styles.row} accessibilityRole="summary" testID="plan-status">
        <Icon name={icon} size={28} color={fg} />
        <View style={styles.text}>
          <AppText variant="headlineSm" style={{ color: fg }}>
            {copy.title}
          </AppText>
          <AppText style={{ color: fg }}>{copy.body}</AppText>
        </View>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  text: { flex: 1, gap: spacing.xxs },
});
