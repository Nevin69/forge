import { z } from "zod";
import {
  emptyData,
  nutrientKeys,
  meals,
  type AppData,
} from "./nutrition/types";
const n = z.number().finite().nonnegative().max(1e9),
  positive = z.number().finite().positive().max(1e7),
  text = z.string().max(2000),
  id = z.string().min(1).max(150);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T12:00:00Z");
    return !isNaN(+d) && d.toISOString().slice(0, 10) === s;
  }, "Invalid calendar date");
const nutrients = z.object(
  Object.fromEntries(nutrientKeys.map((k) => [k, n.nullable()])) as Record<
    (typeof nutrientKeys)[number],
    z.ZodNullable<typeof n>
  >,
);
const profile = z.object({
  age: z.number().int().min(18).max(120),
  height: positive,
  weight: positive,
  sex: z.enum(["male", "female", "unspecified"]),
  activity: z.union([
    z.literal(1.4),
    z.literal(1.6),
    z.literal(1.8),
    z.literal(2.1),
  ]),
  gymDays: z.number().int().min(0).max(7),
  goal: z.enum(["gain", "lose", "maintain"]),
  special: z.boolean(),
  professional: positive.nullable(),
  vegetarian: z.boolean(),
});
const targets = z.object({
  calories: positive,
  protein: n,
  carbs: n,
  fat: n,
  fibre: n,
  water: positive,
});
const food = z.object({
  id,
  name: text.min(1),
  description: text,
  category: text,
  vegetarian: z.boolean(),
  basis: positive,
  nutrients,
  source: text,
  sourceUrl: z
    .string()
    .max(2000)
    .refine((s) => s === "" || /^https:\/\//.test(s)),
  measures: z.array(z.object({ name: text, grams: positive })).max(50),
  custom: z.boolean().optional(),
});
const entry = z
  .object({
    id,
    date: dateSchema,
    meal: z.enum(meals),
    foodId: id,
    name: text.min(1),
    grams: positive,
    basis: positive,
    perBasis: nutrients,
    nutrients,
    source: text,
  })
  .superRefine((e, ctx) => {
    for (const k of nutrientKeys) {
      const expected =
        e.perBasis[k] === null ? null : (e.perBasis[k]! * e.grams) / e.basis;
      if (
        (expected === null) !== (e.nutrients[k] === null) ||
        (expected !== null &&
          Math.abs(expected - e.nutrients[k]!) >
            Math.max(0.001, Math.abs(expected) * 1e-6))
      )
        ctx.addIssue({
          code: "custom",
          message: "Entry snapshot does not match its quantity",
          path: ["nutrients", k],
        });
    }
  });
const schema = z.object({
  version: z.literal(1),
  profile: profile.nullable(),
  targets: targets.nullable(),
  targetHistory: z
    .array(
      z.object({
        id,
        date: dateSchema,
        createdAt: z.string().datetime(),
        goal: z.enum(["gain", "lose", "maintain"]),
        targets: targets.nullable(),
        profile,
      }),
    )
    .max(10000),
  entries: z.array(entry).max(100000),
  foods: z.array(food).max(10000),
  recipes: z
    .array(
      z.object({
        id,
        name: text.min(1),
        ingredients: z
          .array(z.object({ food, grams: positive }))
          .min(1)
          .max(200),
        yieldGrams: positive,
        servings: positive,
        updatedAt: z.string().datetime(),
      }),
    )
    .max(10000),
  savedMeals: z
    .array(
      z.object({
        id,
        name: text.min(1),
        entries: z.array(entry).min(1).max(200),
      }),
    )
    .max(10000),
  weights: z
    .array(
      z.object({
        id,
        date: dateSchema,
        kg: z.number().finite().min(20).max(500),
        note: text,
      }),
    )
    .max(50000),
  water: z.record(dateSchema, n),
  favourites: z.array(id).max(10000),
  recent: z.array(id).max(100),
  shopping: z
    .array(
      z.object({
        id,
        foodId: id,
        name: text.min(1),
        grams: positive,
        price: n.nullable(),
        checked: z.boolean(),
      }),
    )
    .max(10000),
  waterGoal: positive,
  reducedMotion: z.boolean().default(false),
});
export function validateImport(raw: unknown): AppData {
  const parsed = schema.parse(raw);
  for (const key of [
    "entries",
    "foods",
    "recipes",
    "savedMeals",
    "weights",
    "targetHistory",
    "shopping",
  ] as const) {
    const ids = parsed[key].map((x) => x.id);
    if (new Set(ids).size !== ids.length)
      throw Error(`Duplicate IDs in ${key}.`);
  }
  if (new Set(parsed.weights.map((w) => w.date)).size !== parsed.weights.length)
    throw Error("More than one weight entry on the same date.");
  return parsed as AppData;
}
let dbPromise: Promise<IDBDatabase> | null = null;
function openDB() {
  if (!dbPromise)
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(
        typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("qa") === "1"
          ? "forge-nutrition-v1"
          : "forge-journal-v1",
        1,
      );
      request.onupgradeneeded = () =>
        request.result.createObjectStore("journal");
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(Error("Close other Forge tabs, then reload."));
      };
    });
  return dbPromise;
}
export async function readData(): Promise<AppData> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("journal", "readonly"),
      r = tx.objectStore("journal").get("data");
    r.onsuccess = () => {
      try {
        resolve(r.result ? validateImport(r.result) : emptyData());
      } catch (e) {
        reject(e);
      }
    };
    r.onerror = () => reject(r.error);
  });
}
export async function updateData(
  change: (previous: AppData) => AppData,
): Promise<AppData> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("journal", "readwrite"),
      store = tx.objectStore("journal"),
      req = store.get("data");
    let result: AppData;
    req.onsuccess = () => {
      try {
        result = validateImport(
          change(req.result ? validateImport(req.result) : emptyData()),
        );
        store.put(result, "data");
      } catch (e) {
        tx.abort();
        reject(e);
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? Error("Saving failed. Your change was not saved."));
  });
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
