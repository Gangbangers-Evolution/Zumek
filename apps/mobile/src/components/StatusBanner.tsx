import type { PlanStatus } from "@zumek/domain";
import { colors, radius, spacing } from "@zumek/design-tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { STATUS_COPY } from "../lib/labels";
import { AppText } from "./AppText";

const palette: Record<PlanStatus, { bg: string; tone: "success" | "warning" | "danger" }> = {
  ok: { bg: colors.successSoft, tone: "success" },
  over_budget_close: { bg: colors.warningSoft, tone: "warning" },
  infeasible_likely: { bg: colors.dangerSoft, tone: "danger" },
};

export function StatusBanner({ status, children }: { status: PlanStatus; children?: ReactNode }) {
  const { bg, tone } = palette[status];
  const copy = STATUS_COPY[status];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityRole="summary" testID="plan-status">
      <AppText variant="heading" tone={tone}>
        {copy.title}
      </AppText>
      <AppText>{copy.body}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
});
