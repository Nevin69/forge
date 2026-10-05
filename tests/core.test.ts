import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  scale,
  totals,
  restingEnergy,
  estimate,
  recipeFood,
  makeEntry,
  resizeEntry,
  targetsForDate,
  dateShift,
  csv,
  targetWarnings,
  populationIssue,
} from "../lib/nutrition/calculations";
import {
  emptyData,
  emptyNutrients,
  type Food,
  type Profile,
  type Recipe,
} from "../lib/nutrition/types";
import { validateImport, updateData, readData } from "../lib/storage";
import { reference } from "../lib/nutrition/references";
import foods from "../lib/nutrition/foods.json";
const profile: Profile = {
  age: 30,
  height: 175,
  weight: 70,
  sex: "male",
  activity: 1.6,
  gymDays: 3,
  goal: "maintain",
  special: false,
  professional: null,
  vegetarian: false,
};
const sample: Food = {
  id: "test-food",
  name: "Test food",
  description: "Synthetic test fixture, never added to catalogue",
  category: "Tests",
  vegetarian: true,
  basis: 100,
  nutrients: {
    ...emptyNutrients(),
    calories: 200,
    protein: 10,
    carbs: 20,
    fat: 80 / 9,
    fibre: 5,
    calcium: 0,
  },
  source: "Test fixture",
  sourceUrl: "",
  measures: [],
};
const date = "2026-10-05";
test("Mifflin uses kg, cm, years and published sex coefficients", () => {
  assert.equal(restingEnergy(profile), 1648.75);
  assert.equal(restingEnergy({ ...profile, sex: "female" }), 1482.75);
  assert.equal(estimate(profile).maintenance, 2638);
  assert.equal(estimate(profile).targets!.calories, 2640);
});
test("Goal adjustments and coherent macros", () => {
  const gain = estimate({ ...profile, goal: "gain" }).targets!,
    loss = estimate({ ...profile, goal: "lose" }).targets!;
  assert.equal(gain.calories, 2770);
  assert.equal(loss.calories, 2370);
  assert.equal(gain.protein, 112);
  assert.ok(
    Math.abs(gain.protein * 4 + gain.carbs * 4 + gain.fat * 9 - gain.calories) <
      1,
  );
  assert.equal(targetWarnings(gain, profile).length, 0);
  assert.ok(
    targetWarnings({ ...gain, carbs: 0 }, profile)[0].includes("Macros"),
  );
});
test("No out-of-population automatic targets", () => {
  for (const p of [
    { ...profile, age: 18 },
    { ...profile, age: 79 },
    { ...profile, sex: "unspecified" as const },
    { ...profile, special: true },
    { ...profile, weight: 45 },
  ]) {
    assert.equal(estimate(p).targets, null);
    assert.ok(populationIssue(p));
  }
  assert.equal(
    estimate({ ...profile, professional: 2200 }).targets!.calories,
    2200,
  );
});
test("Scaling handles fractional grams, missing nutrients and known zero distinctly", () => {
  const n = scale(sample.nutrients, 37.5);
  assert.equal(n.calories, 75);
  assert.equal(n.protein, 3.75);
  assert.equal(n.calcium, 0);
  assert.equal(n.iron, null);
  for (const q of [0, -1, NaN, Infinity])
    assert.throws(() => scale(sample.nutrients, q));
});
test("Daily totals expose coverage instead of zero-filling unknowns", () => {
  const t = totals([sample.nutrients, { ...sample.nutrients, protein: null }]);
  assert.equal(t.protein.value, 10);
  assert.equal(t.protein.partial, true);
  assert.equal(t.protein.known, 1);
  assert.equal(t.iron.value, null);
  assert.equal(t.calcium.value, 0);
  assert.equal(totals([]).calories.value, null);
});
test("Recipe grams, servings and historical snapshots remain stable", () => {
  const r: Recipe = {
    id: "r",
    name: "Test recipe",
    ingredients: [{ food: sample, grams: 150 }],
    yieldGrams: 300,
    servings: 2,
    updatedAt: new Date().toISOString(),
  };
  const f = recipeFood(r);
  assert.equal(f.nutrients.calories, 300);
  assert.equal(f.measures[0].grams, 150);
  const e = makeEntry(f, 150, date, "Lunch");
  assert.equal(e.nutrients.calories, 150);
  r.ingredients[0].grams = 500;
  assert.equal(recipeFood(r).nutrients.calories, 1000);
  assert.equal(e.nutrients.calories, 150);
  assert.equal(resizeEntry(e, 75).nutrients.calories, 75);
  assert.throws(() => recipeFood({ ...r, yieldGrams: 0 }));
  assert.equal(f.nutrients.iron, null);
});
test("Age/sex references and unit kinds are correct", () => {
  assert.deepEqual(reference(profile, "calcium"), { value: 1000, kind: "RDA" });
  assert.equal(
    reference({ ...profile, sex: "female", age: 51 }, "calcium")!.value,
    1200,
  );
  assert.equal(reference({ ...profile, age: 71 }, "vitaminD")!.value, 20);
  assert.equal(reference(profile, "potassium")!.kind, "AI");
  assert.equal(reference(profile, "sodium")!.kind, "CDRR");
  assert.equal(reference({ ...profile, sex: "female" }, "iron")!.value, 18);
  assert.equal(
    reference({ ...profile, vegetarian: true }, "iron")!.value,
    14.4,
  );
  assert.equal(reference({ ...profile, special: true }, "iron"), null);
});
test("Calendar arithmetic handles leap days and month boundaries", () => {
  assert.equal(dateShift("2024-03-01", -1), "2024-02-29");
  assert.equal(dateShift("2026-01-01", -1), "2025-12-31");
});
test("Catalogue is traceable, finite, gram-based and has named preparation", () => {
  assert.equal(foods.length, 45);
  for (const f of foods) {
    assert.ok(f.sourceUrl.startsWith("https://"));
    assert.equal(f.basis, 100);
    assert.ok(f.description);
    assert.ok(f.nutrients.calories !== null);
    for (const n of Object.values(f.nutrients))
      assert.ok(n === null || (Number.isFinite(n) && n >= 0));
    for (const m of f.measures) assert.ok(m.grams > 0);
  }
});
test("Import/export round-trip, validation and corruption detection", () => {
  const d = emptyData();
  d.entries = [makeEntry(sample, 75, date, "Dinner")];
  assert.deepEqual(validateImport(JSON.parse(JSON.stringify(d))), d);
  assert.throws(() => validateImport({ ...d, version: 2 }));
  assert.throws(() =>
    validateImport({
      ...d,
      entries: [{ ...d.entries[0], date: "2026-02-30" }],
    }),
  );
  assert.throws(() =>
    validateImport({ ...d, entries: [{ ...d.entries[0], grams: -1 }] }),
  );
  assert.throws(() =>
    validateImport({
      ...d,
      entries: [
        {
          ...d.entries[0],
          nutrients: { ...d.entries[0].nutrients, calories: 999 },
        },
      ],
    }),
  );
  assert.throws(() =>
    validateImport({ ...d, entries: [d.entries[0], d.entries[0]] }),
  );
  assert.throws(() => validateImport({ ...d, water: { "bad-date": 250 } }));
});
test("CSV preserves missing data, quotes text, and blocks formula injection", () => {
  assert.equal(csv([["=1+1", "a,b", 'a"b', null]]), '"\'=1+1","a,b","a""b",""');
});
test("Historical targets do not leak into earlier dates", () => {
  const d = emptyData(),
    t = estimate(profile).targets!;
  d.targetHistory = [
    {
      id: "t",
      date,
      createdAt: "2026-10-05T00:00:00Z",
      targets: t,
      profile,
      goal: "maintain",
    },
  ];
  assert.equal(targetsForDate(d, "2026-10-04"), null);
  assert.deepEqual(targetsForDate(d, date), t);
});
test("IndexedDB saves, reopens, restores and serialises concurrent updates", async () => {
  await updateData(() => emptyData());
  await Promise.all([
    updateData((d) => ({
      ...d,
      entries: [...d.entries, makeEntry(sample, 50, date, "Lunch")],
    })),
    updateData((d) => ({
      ...d,
      entries: [...d.entries, makeEntry(sample, 100, date, "Dinner")],
    })),
  ]);
  const saved = await readData();
  assert.equal(saved.entries.length, 2);
  const backup = JSON.stringify(saved);
  await updateData(() => emptyData());
  assert.equal((await readData()).entries.length, 0);
  await updateData(() => validateImport(JSON.parse(backup)));
  assert.deepEqual(await readData(), saved);
  await assert.rejects(updateData((d) => ({ ...d, waterGoal: -1 })));
  assert.deepEqual(await readData(), saved);
});
test("Guardrails withhold unusually low generated energy and invalid input", () => {
  assert.equal(
    estimate({
      ...profile,
      age: 78,
      height: 120,
      weight: 35,
      sex: "female",
      activity: 1.4,
    }).targets,
    null,
  );
  assert.equal(estimate({ ...profile, weight: NaN }).targets, null);
  assert.equal(estimate({ ...profile, professional: 500 }).targets, null);
});
