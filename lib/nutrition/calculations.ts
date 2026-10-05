import {
  nutrientKeys,
  emptyNutrients,
  type Nutrients,
  type Profile,
  type Targets,
  type Food,
  type Recipe,
  type Entry,
  type Meal,
  type AppData,
} from "./types";
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function dateShift(date: string, n: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const uid = () => crypto.randomUUID();
export function populationIssue(p: Profile): string | null {
  if (
    ![p.age, p.height, p.weight, p.activity].every(Number.isFinite) ||
    p.height <= 0 ||
    p.weight <= 0 ||
    p.age <= 0
  )
    return "Enter valid age, height in centimetres and weight in kilograms.";
  if (p.age < 19 || p.age > 78)
    return "The Mifflin–St Jeor study included adults aged 19–78. No automatic personalised target is provided outside that range.";
  if (p.special)
    return "Pregnancy, breastfeeding, an eating-disorder history, or a condition affecting nutrition needs requires individual guidance. Use the diary without generated targets, or enter an existing professional target.";
  if (p.sex === "unspecified")
    return "This equation requires a male or female study parameter. Choose one with professional guidance, or use an existing professional target.";
  if (p.height < 120 || p.height > 230 || p.weight < 35 || p.weight > 300)
    return "These measurements fall outside this app’s estimation guardrails. Check your units or use professional guidance.";
  if (p.weight / (p.height / 100) ** 2 < 18.5)
    return "For a BMI below 18.5, this app does not generate calorie or weight-loss targets. BMI is only a screening measure; individual assessment matters.";
  return null;
}
export function restingEnergy(p: Profile) {
  return (
    10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161)
  );
}
export function estimate(p: Profile): {
  resting: number | null;
  maintenance: number | null;
  targets: Targets | null;
  issue: string | null;
} {
  const issue = populationIssue(p);
  const resting = issue ? null : restingEnergy(p);
  const maintenance = resting === null ? null : resting * p.activity;
  let calories =
    p.professional ??
    (maintenance === null
      ? null
      : Math.round(
          (maintenance *
            (p.goal === "gain" ? 1.05 : p.goal === "lose" ? 0.9 : 1)) /
            10,
        ) * 10);
  if (p.age < 18) calories = null;
  if (calories === null) return { resting, maintenance, targets: null, issue };
  // No automatic macros for populations outside the healthy-adult scope.
  if (issue)
    return {
      resting,
      maintenance,
      targets: null,
      issue:
        issue +
        (p.professional
          ? " Your professional calorie target is recorded; set their macro targets in Settings."
          : ""),
    };
  if (!p.professional && calories < (p.sex === "male" ? 1500 : 1200))
    return {
      resting,
      maintenance,
      targets: null,
      issue:
        "This estimate is below the app’s conservative energy guardrail. No automatic target is provided; ask a qualified professional for an individual assessment.",
    };
  if (p.professional && calories * 0.7 < p.weight * 1.6 * 4)
    return {
      resting,
      maintenance,
      targets: null,
      issue:
        "The professional calorie target is recorded, but the default protein and fat allocation would not fit. Enter your professionally recommended macro targets in Settings.",
    };
  const protein = Math.round(p.weight * 1.6);
  const fat = Math.round((calories * 0.3) / 9);
  const carbs = Math.max(0, (calories - protein * 4 - fat * 9) / 4);
  return {
    resting,
    maintenance,
    targets: {
      calories,
      protein,
      carbs: Math.round(carbs * 10) / 10,
      fat,
      fibre: p.sex === "male" ? (p.age > 50 ? 30 : 38) : p.age > 50 ? 21 : 25,
      water: 2500,
    },
    issue,
  };
}
export function targetWarnings(t: Targets, p: Profile | null) {
  const issues: string[] = [];
  const macro = t.protein * 4 + t.carbs * 4 + t.fat * 9;
  if (Math.abs(macro - t.calories) > Math.max(20, t.calories * 0.02))
    issues.push(
      `Macros add up to ${Math.round(macro)} kcal, ${Math.round(Math.abs(macro - t.calories))} kcal ${macro > t.calories ? "above" : "below"} your calorie target. Adjust macros or calories.`,
    );
  if (p && !populationIssue(p)) {
    const m = restingEnergy(p) * p.activity;
    if (t.calories < m * 0.8)
      issues.push(
        "This is more than 20% below estimated maintenance. This app does not recommend an aggressive deficit; review with a qualified professional.",
      );
  }
  if (t.calories < 1200)
    issues.push(
      "This is a very low energy target. Do not use it without individual professional supervision.",
    );
  return issues;
}
export function scale(n: Nutrients, grams: number, basis = 100): Nutrients {
  if (
    !Number.isFinite(grams) ||
    grams <= 0 ||
    !Number.isFinite(basis) ||
    basis <= 0
  )
    throw Error("Enter a positive, finite quantity.");
  return Object.fromEntries(
    nutrientKeys.map((k) => [k, n[k] === null ? null : (n[k] * grams) / basis]),
  ) as Nutrients;
}
export function totals(list: Nutrients[]) {
  return Object.fromEntries(
    nutrientKeys.map((k) => {
      const known = list.filter((n) => n[k] !== null);
      return [
        k,
        {
          value: known.length ? known.reduce((s, n) => s + n[k]!, 0) : null,
          known: known.length,
          count: list.length,
          partial: known.length < list.length,
        },
      ];
    }),
  ) as Record<
    keyof Nutrients,
    { value: number | null; known: number; count: number; partial: boolean }
  >;
}
export function recipeFood(r: Recipe): Food {
  if (!r.ingredients.length || !(r.yieldGrams > 0) || !(r.servings > 0))
    throw Error("Add ingredients and a positive yield and serving count.");
  const all = r.ingredients.map((i) =>
    scale(i.food.nutrients, i.grams, i.food.basis),
  );
  const sum = totals(all);
  const n = emptyNutrients();
  for (const k of nutrientKeys) n[k] = sum[k].partial ? null : sum[k].value;
  return {
    id: r.id,
    name: r.name,
    description: "Homemade recipe • weighed final yield",
    category: "Recipes",
    vegetarian: r.ingredients.every((i) => i.food.vegetarian),
    basis: r.yieldGrams,
    nutrients: n,
    source: "Your ingredient snapshots; no cooking-retention adjustment",
    sourceUrl: "",
    measures: [{ name: "serving", grams: r.yieldGrams / r.servings }],
  };
}
export function makeEntry(
  f: Food,
  grams: number,
  date: string,
  meal: Meal,
): Entry {
  return {
    id: uid(),
    date,
    meal,
    foodId: f.id,
    name: f.name,
    grams,
    basis: f.basis,
    perBasis: structuredClone(f.nutrients),
    nutrients: scale(f.nutrients, grams, f.basis),
    source: f.source,
  };
}
export function resizeEntry(e: Entry, grams: number) {
  return { ...e, grams, nutrients: scale(e.perBasis, grams, e.basis) };
}
export function targetsForDate(data: AppData, date: string) {
  return (
    [...data.targetHistory]
      .filter((h) => h.date <= date)
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      )[0]?.targets ?? null
  );
}
export function csv(rows: (string | number | null)[][]) {
  return rows
    .map((row) =>
      row
        .map((v) => {
          let s = v === null ? "" : String(v);
          if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
