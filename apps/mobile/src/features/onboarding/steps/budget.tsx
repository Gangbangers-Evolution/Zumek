import { colors, radius, spacing, touchTarget, typography } from "@zumek/design-tokens";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText } from "../../../components/AppText";
import { Card } from "../../../components/Card";
import { Chip, ChipGroup } from "../../../components/Chip";
import { Icon } from "../../../components/Icon";
import { IconTile } from "../../../components/IconTile";
import { EXAMPLES } from "../../examples";
import { centsToPesosInput, formatCents, parsePesosToCents } from "../../../lib/money";
import { useOnboarding } from "../../../state/onboarding";

const SUGGESTIONS = [60000, 90000, 125000, 180000];
const STEP_CENTS = 5000;

export function BudgetStep() {
  const { state, dispatch } = useOnboarding();
  const [text, setText] = useState(state.budgetCents === null ? "" : centsToPesosInput(state.budgetCents));
  const cents = parsePesosToCents(text);
  const error =
    text === "" ? null : cents === null ? "Escribe solo números, por ejemplo 900 o 900.50" : cents === 0 ? "El presupuesto debe ser mayor a $0" : null;

  const setBudget = (value: number | null) => dispatch({ type: "setBudget", cents: value && value > 0 ? value : null });
  const setFromCents = (value: number) => {
    setText(centsToPesosInput(value));
    setBudget(value);
  };
  const adjust = (delta: number) => setFromCents(Math.max(STEP_CENTS, (state.budgetCents ?? 0) + delta));

  return (
    <>
      <Card style={styles.hero}>
        <AppText variant="labelSm" tone="muted">
          PRESUPUESTO SEMANAL (MXN)
        </AppText>
        <View style={styles.amountRow}>
          <AppText variant="headlineLg" tone="accent">
            $
          </AppText>
          <TextInput
            accessibilityLabel="Presupuesto semanal (MXN)"
            value={text}
            placeholder="900"
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
            inputMode="decimal"
            onChangeText={(value) => {
              setText(value);
              setBudget(parsePesosToCents(value));
            }}
            style={styles.amount}
          />
          <AppText variant="labelMd" tone="muted">
            MXN
          </AppText>
        </View>
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}
        <View style={styles.adjustRow}>
          <RoundButton icon="remove" label="Bajar $50" onPress={() => adjust(-STEP_CENTS)} />
          <AppText variant="caption" tone="muted">
            Ajuste semanal
          </AppText>
          <RoundButton icon="add" label="Subir $50" onPress={() => adjust(STEP_CENTS)} />
        </View>
      </Card>

      <AppText variant="labelMd" tone="muted">
        Sugerencias habituales
      </AppText>
      <ChipGroup>
        {SUGGESTIONS.map((value) => (
          <Chip key={value} label={formatCents(value)} selected={state.budgetCents === value} onPress={() => setFromCents(value)} />
        ))}
      </ChipGroup>

      <Card tone="savings">
        <View style={styles.tip}>
          <IconTile name="savings" tone="savings" />
          <View style={styles.flex}>
            <AppText variant="labelMd" style={{ color: colors.onSecondaryContainer }}>
              Consejo de ahorro Zumek
            </AppText>
            <AppText style={{ color: colors.onSecondaryContainer }}>{EXAMPLES.budgetTip}</AppText>
          </View>
        </View>
      </Card>
    </>
  );
}

function RoundButton({ icon, label, onPress }: { icon: "add" | "remove"; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && { backgroundColor: colors.surfaceContainerHigh }]}
    >
      <Icon name={icon} size={22} color={colors.onSurface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  amountRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  amount: {
    ...typography.currencyHero,
    color: colors.primary,
    minWidth: 120,
    maxWidth: 220,
    textAlign: "center",
    outlineStyle: "solid",
    outlineWidth: 0,
  },
  adjustRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  round: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  tip: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xxs },
});
