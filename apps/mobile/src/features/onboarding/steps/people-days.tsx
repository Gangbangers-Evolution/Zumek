import { colors, spacing } from "@zumek/design-tokens";
import { StyleSheet, View } from "react-native";
import { AppText } from "../../../components/AppText";
import { Card } from "../../../components/Card";
import { Chip, ChipGroup } from "../../../components/Chip";
import { IconTile } from "../../../components/IconTile";
import { Stepper } from "../../../components/Stepper";
import { formatCents } from "../../../lib/money";
import { useOnboarding } from "../../../state/onboarding";

const PEOPLE_PRESETS = [
  { label: "Solo yo (1)", value: 1 },
  { label: "En pareja (2)", value: 2 },
  { label: "Familia pequeña (4)", value: 4 },
  { label: "Familia grande (6)", value: 6 },
];
const DAY_PRESETS = [
  { label: "3 días", value: 3 },
  { label: "5 días (semana laboral)", value: 5 },
  { label: "7 días (semana completa)", value: 7 },
];

export function PeopleDaysStep() {
  const { state, dispatch } = useOnboarding();
  const setPeople = (count: number) => dispatch({ type: "setPeople", count });
  const setDays = (count: number) => dispatch({ type: "setDays", count });
  const meals = state.daysCount * state.mealTypes.length;
  // Calculo real con las respuestas: presupuesto / (comidas * personas)
  const perPersonMeal = state.budgetCents && meals > 0 ? Math.round(state.budgetCents / (meals * state.peopleCount)) : null;

  return (
    <>
      <Card>
        <View style={styles.header}>
          <IconTile name="group" />
          <AppText variant="headlineSm" style={styles.flex}>
            ¿Para cuántas personas cocinas?
          </AppText>
        </View>
        <Stepper
          label="Personas"
          value={state.peopleCount}
          min={1}
          max={10}
          onChange={setPeople}
          format={(n) => `${n} ${n === 1 ? "persona" : "personas"}`}
          caption="Porciones de adultos"
        />
        <ChipGroup>
          {PEOPLE_PRESETS.map((p) => (
            <Chip key={p.value} label={p.label} selected={state.peopleCount === p.value} onPress={() => setPeople(p.value)} />
          ))}
        </ChipGroup>
      </Card>

      <Card>
        <View style={styles.header}>
          <IconTile name="calendar" tone="savings" />
          <AppText variant="headlineSm" style={styles.flex}>
            ¿Para cuántos días planificas?
          </AppText>
        </View>
        <Stepper
          label="Días"
          value={state.daysCount}
          min={1}
          max={7}
          onChange={setDays}
          format={(n) => `${n} ${n === 1 ? "día" : "días"}`}
          caption="Ciclo semanal"
        />
        <ChipGroup>
          {DAY_PRESETS.map((d) => (
            <Chip key={d.value} label={d.label} selected={state.daysCount === d.value} onPress={() => setDays(d.value)} />
          ))}
        </ChipGroup>
      </Card>

      <Card tone="savings">
        <AppText variant="labelMd" style={{ color: colors.onSecondaryContainer }}>
          Cálculo estimado en tiempo real
        </AppText>
        <AppText style={{ color: colors.onSecondaryContainer }}>
          Total de {meals} comidas.
          {perPersonMeal !== null ? ` Presupuesto estimado: ${formatCents(perPersonMeal)} por persona/comida.` : ""}
        </AppText>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1 },
});
