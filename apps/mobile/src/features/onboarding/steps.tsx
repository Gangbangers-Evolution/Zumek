import { colors, radius, spacing, touchTarget } from "@zumek/design-tokens";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { Chip, ChipGroup } from "../../components/Chip";
import { Stepper } from "../../components/Stepper";
import { TextField } from "../../components/TextField";
import { capitalize, MEAL_TYPE_LABEL, MEAL_TYPES } from "../../lib/labels";
import { centsToPesosInput, parsePesosToCents } from "../../lib/money";
import { unitLabel } from "../../lib/quantity";
import { useCatalog } from "../../state/catalog";
import { useOnboarding, type OnboardingState } from "../../state/onboarding";

export interface OnboardingStep {
  title: string;
  subtitle: string;
  isValid: (state: OnboardingState) => boolean;
  Component: ComponentType;
}

function BudgetStep() {
  const { state, dispatch } = useOnboarding();
  const [text, setText] = useState(state.budgetCents === null ? "" : centsToPesosInput(state.budgetCents));
  const cents = parsePesosToCents(text);
  const error = text === "" ? null : cents === null ? "Escribe solo números, por ejemplo 900 o 900.50" : cents === 0 ? "El presupuesto debe ser mayor a $0" : null;

  return (
    <TextField
      label="Presupuesto semanal (MXN)"
      prefix="$"
      value={text}
      placeholder="900"
      keyboardType="decimal-pad"
      inputMode="decimal"
      error={error}
      onChangeText={(value) => {
        setText(value);
        const parsed = parsePesosToCents(value);
        dispatch({ type: "setBudget", cents: parsed && parsed > 0 ? parsed : null });
      }}
    />
  );
}

function PeopleDaysStep() {
  const { state, dispatch } = useOnboarding();
  return (
    <Card>
      <Stepper
        label="Personas"
        value={state.peopleCount}
        min={1}
        max={10}
        onChange={(count) => dispatch({ type: "setPeople", count })}
      />
      <Stepper
        label="Días"
        value={state.daysCount}
        min={1}
        max={7}
        onChange={(count) => dispatch({ type: "setDays", count })}
      />
    </Card>
  );
}

function MealsStep() {
  const { state, dispatch } = useOnboarding();
  return (
    <ChipGroup>
      {MEAL_TYPES.map((meal) => (
        <Chip
          key={meal}
          label={MEAL_TYPE_LABEL[meal]}
          selected={state.mealTypes.includes(meal)}
          onPress={() => dispatch({ type: "toggle", field: "mealTypes", value: meal })}
        />
      ))}
    </ChipGroup>
  );
}

function CuisinesStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  const cuisines = useMemo(() => [...new Set(catalog.recipes.map((r) => r.cuisine))].sort(), [catalog]);
  return (
    <ChipGroup>
      {cuisines.map((cuisine) => (
        <Chip
          key={cuisine}
          label={cuisine}
          selected={state.cuisines.includes(cuisine)}
          onPress={() => dispatch({ type: "toggle", field: "cuisines", value: cuisine })}
        />
      ))}
    </ChipGroup>
  );
}

function PreferencesStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  const tags = useMemo(() => [...new Set(catalog.recipes.flatMap((r) => r.tags))].sort(), [catalog]);
  const allergens = useMemo(() => [...new Set(catalog.recipes.flatMap((r) => r.allergens))].sort(), [catalog]);
  return (
    <>
      <AppText variant="label">Me gusta que sea…</AppText>
      <ChipGroup>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={capitalize(tag)}
            selected={state.tags.includes(tag)}
            onPress={() => dispatch({ type: "toggle", field: "tags", value: tag })}
          />
        ))}
      </ChipGroup>
      <AppText variant="label">Alergias</AppText>
      <AppText variant="caption" tone="secondary">
        Las recetas con estos alérgenos nunca aparecerán en tu plan.
      </AppText>
      <ChipGroup>
        {allergens.map((allergen) => (
          <Chip
            key={allergen}
            label={capitalize(allergen)}
            selected={state.allergens.includes(allergen)}
            onPress={() => dispatch({ type: "toggle", field: "allergens", value: allergen })}
          />
        ))}
      </ChipGroup>
    </>
  );
}

function useProductSearch() {
  const catalog = useCatalog();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.canonical_products.filter((p) => p.name.toLowerCase().includes(q));
  }, [catalog, query]);
  return { query, setQuery, results };
}

function ExcludedStep() {
  const { state, dispatch } = useOnboarding();
  const { query, setQuery, results } = useProductSearch();
  return (
    <>
      <TextField label="Buscar ingrediente" value={query} placeholder="Ej. cebolla" onChangeText={setQuery} />
      {results.length === 0 ? (
        <AppText tone="secondary">No encontramos ingredientes con “{query}”.</AppText>
      ) : (
        <ChipGroup>
          {results.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              selected={state.excludedProductIds.includes(p.id)}
              onPress={() => dispatch({ type: "toggle", field: "excludedProductIds", value: p.id })}
            />
          ))}
        </ChipGroup>
      )}
    </>
  );
}

function PantryStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  const { query, setQuery, results } = useProductSearch();
  const selected = catalog.canonical_products.filter((p) => p.id in state.pantry);

  return (
    <>
      <TextField label="Buscar ingrediente" value={query} placeholder="Ej. arroz" onChangeText={setQuery} />
      {results.length === 0 ? (
        <AppText tone="secondary">No encontramos ingredientes con “{query}”.</AppText>
      ) : (
        <ChipGroup>
          {results.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              selected={p.id in state.pantry}
              onPress={() =>
                dispatch({ type: "setPantryItem", productId: p.id, quantity: p.id in state.pantry ? null : 0 })
              }
            />
          ))}
        </ChipGroup>
      )}
      {selected.length === 0 ? (
        <AppText tone="secondary">Tu despensa está vacía. Puedes saltar este paso.</AppText>
      ) : (
        <Card>
          <AppText variant="label">¿Cuánto tienes?</AppText>
          {selected.map((p) => (
            <TextField
              key={p.id}
              label={`${p.name} (${unitLabel(p.unit_type)})`}
              keyboardType="number-pad"
              inputMode="numeric"
              value={state.pantry[p.id] ? String(state.pantry[p.id]) : ""}
              placeholder="0"
              onChangeText={(value) => {
                const n = Number(value.replace(/\D/g, ""));
                dispatch({ type: "setPantryItem", productId: p.id, quantity: Number.isFinite(n) ? n : 0 });
              }}
            />
          ))}
        </Card>
      )}
    </>
  );
}

function StoresStep() {
  const { state, dispatch } = useOnboarding();
  const catalog = useCatalog();
  return (
    <ChipGroup>
      {catalog.stores
        .filter((s) => s.active)
        .map((store) => (
          <Chip
            key={store.id}
            label={store.name}
            selected={state.storeIds.includes(store.id)}
            onPress={() => dispatch({ type: "toggle", field: "storeIds", value: store.id })}
          />
        ))}
    </ChipGroup>
  );
}

const SAVINGS_OPTIONS: { weight: number; label: string; hint: string }[] = [
  { weight: 0, label: "Máximo ahorro", hint: "El plan más barato, aunque vayas a más tiendas" },
  { weight: 0.25, label: "Más ahorro", hint: "Prioriza el precio" },
  { weight: 0.5, label: "Balance", hint: "Un poco de todo" },
  { weight: 0.75, label: "Más conveniencia", hint: "Menos tiendas y recetas más rápidas" },
  { weight: 1, label: "Máxima conveniencia", hint: "Lo más práctico, aunque cueste un poco más" },
];

function SavingsStep() {
  const { state, dispatch } = useOnboarding();
  return (
    <View accessibilityRole="radiogroup" style={styles.options}>
      {SAVINGS_OPTIONS.map((option) => {
        const selected = state.savingsWeight === option.weight;
        return (
          <Pressable
            key={option.weight}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityHint={option.hint}
            accessibilityState={{ checked: selected }}
            onPress={() => dispatch({ type: "setSavingsWeight", weight: option.weight })}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <AppText variant="label" tone={selected ? "accent" : "primary"}>
              {option.label}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {option.hint}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "¿Cuánto quieres gastar?",
    subtitle: "Armamos tu semana alrededor de este presupuesto.",
    isValid: (s) => s.budgetCents !== null && s.budgetCents > 0,
    Component: BudgetStep,
  },
  {
    title: "¿Para cuántos y cuántos días?",
    subtitle: "Ajustamos las cantidades de cada receta.",
    isValid: (s) => s.peopleCount >= 1 && s.daysCount >= 1 && s.daysCount <= 7,
    Component: PeopleDaysStep,
  },
  {
    title: "¿Qué comidas planeamos?",
    subtitle: "Elige al menos una.",
    isValid: (s) => s.mealTypes.length > 0,
    Component: MealsStep,
  },
  {
    title: "¿Qué cocinas te gustan?",
    subtitle: "Si no eliges ninguna, consideramos todas.",
    isValid: () => true,
    Component: CuisinesStep,
  },
  {
    title: "Preferencias y alergias",
    subtitle: "Todo es opcional.",
    isValid: () => true,
    Component: PreferencesStep,
  },
  {
    title: "¿Algo que no quieras comer?",
    subtitle: "Nunca incluiremos estos ingredientes.",
    isValid: () => true,
    Component: ExcludedStep,
  },
  {
    title: "¿Qué tienes en casa?",
    subtitle: "Lo usamos primero para que compres menos.",
    isValid: () => true,
    Component: PantryStep,
  },
  {
    title: "¿Dónde compras?",
    subtitle: "Elige al menos una tienda.",
    isValid: (s) => s.storeIds.length > 0,
    Component: StoresStep,
  },
  {
    title: "¿Ahorro o conveniencia?",
    subtitle: "Define qué pesa más cuando hay que elegir.",
    isValid: () => true,
    Component: SavingsStep,
  },
];

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  option: {
    minHeight: touchTarget.min,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xxs,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
