export const nutrientKeys = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fibre",
  "calcium",
  "iron",
  "magnesium",
  "potassium",
  "sodium",
  "zinc",
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "vitaminB12",
  "folate",
] as const;
export type Nutrient = (typeof nutrientKeys)[number];
export type Nutrients = Record<Nutrient, number | null>;
export const meals = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;
export type Meal = (typeof meals)[number];
export type Food = {
  id: string;
  name: string;
  description: string;
  category: string;
  vegetarian: boolean;
  basis: number;
  nutrients: Nutrients;
  source: string;
  sourceUrl: string;
  measures: { name: string; grams: number }[];
  custom?: boolean;
};
export type Ingredient = { food: Food; grams: number };
export type Recipe = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  yieldGrams: number;
  servings: number;
  updatedAt: string;
};
export type Entry = {
  id: string;
  date: string;
  meal: Meal;
  foodId: string;
  name: string;
  grams: number;
  basis: number;
  perBasis: Nutrients;
  nutrients: Nutrients;
  source: string;
};
export type Targets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  water: number;
};
export type Profile = {
  age: number;
  height: number;
  weight: number;
  sex: "male" | "female" | "unspecified";
  activity: number;
  gymDays: number;
  goal: "gain" | "lose" | "maintain";
  special: boolean;
  professional: number | null;
  vegetarian: boolean;
};
export type TargetRecord = {
  id: string;
  date: string;
  createdAt: string;
  goal: Profile["goal"];
  targets: Targets | null;
  profile: Profile;
};
export type Weight = { id: string; date: string; kg: number; note: string };
export type SavedMeal = { id: string; name: string; entries: Entry[] };
export type ShopItem = {
  id: string;
  foodId: string;
  name: string;
  grams: number;
  price: number | null;
  checked: boolean;
};
export type AppData = {
  version: 1;
  profile: Profile | null;
  targets: Targets | null;
  targetHistory: TargetRecord[];
  entries: Entry[];
  foods: Food[];
  recipes: Recipe[];
  savedMeals: SavedMeal[];
  weights: Weight[];
  water: Record<string, number>;
  favourites: string[];
  recent: string[];
  shopping: ShopItem[];
  waterGoal: number;
  reducedMotion: boolean;
};
export const emptyData = (): AppData => ({
  version: 1,
  profile: null,
  targets: null,
  targetHistory: [],
  entries: [],
  foods: [],
  recipes: [],
  savedMeals: [],
  weights: [],
  water: {},
  favourites: [],
  recent: [],
  shopping: [],
  waterGoal: 2500,
  reducedMotion: false,
});
export const emptyNutrients = (): Nutrients =>
  Object.fromEntries(nutrientKeys.map((k) => [k, null])) as Nutrients;
