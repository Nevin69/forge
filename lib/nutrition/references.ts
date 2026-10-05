import type { Profile, Nutrient } from "./types";
export const sources = [
  [
    "Resting energy · Mifflin & St Jeor (1990)",
    "https://pubmed.ncbi.nlm.nih.gov/2305711/",
  ],
  [
    "Activity levels · FAO/WHO/UNU",
    "https://www.fao.org/4/y5686e/y5686e07.htm",
  ],
  [
    "Protein & resistance training · Morton et al. (2018)",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC5867436/",
  ],
  [
    "Conservative muscle-gain surplus · Helms et al. (2023)",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC10620361/",
  ],
  [
    "Gradual weight loss · Garthe et al. (2011)",
    "https://pubmed.ncbi.nlm.nih.gov/21558571/",
  ],
  [
    "Energy guardrails context · AHA/ACC/TOS adult guideline",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/",
  ],
  [
    "Paneer package reference · Sabar Dairy",
    "https://sabardairy.org/product/amul-fresh-paneer/",
  ],
  [
    "Food composition · USDA SR Legacy (2018)",
    "https://fdc.nal.usda.gov/download-datasets/",
  ],
  [
    "Adult micronutrients · NIH Office of Dietary Supplements",
    "https://ods.od.nih.gov/factsheets/list-VitaminsMinerals/",
  ],
  [
    "Macronutrient reference intakes · National Academies / USDA",
    "https://www.nal.usda.gov/human-nutrition-and-food-safety/food-composition/macronutrients",
  ],
  [
    "Sodium CDRR · National Academies (2019)",
    "https://www.nationalacademies.org/read/25353/chapter/13",
  ],
];
export const nutrientInfo: Record<
  Nutrient,
  { label: string; unit: string; slug?: string }
> = {
  calories: { label: "Calories", unit: "kcal" },
  protein: { label: "Protein", unit: "g" },
  carbs: { label: "Carbohydrate", unit: "g" },
  fat: { label: "Fat", unit: "g" },
  fibre: { label: "Fibre", unit: "g" },
  calcium: { label: "Calcium", unit: "mg", slug: "Calcium" },
  iron: { label: "Iron", unit: "mg", slug: "Iron" },
  magnesium: { label: "Magnesium", unit: "mg", slug: "Magnesium" },
  potassium: { label: "Potassium", unit: "mg", slug: "potassium" },
  sodium: { label: "Sodium", unit: "mg" },
  zinc: { label: "Zinc", unit: "mg", slug: "Zinc" },
  vitaminA: { label: "Vitamin A", unit: "µg RAE", slug: "VitaminA" },
  vitaminC: { label: "Vitamin C", unit: "mg", slug: "VitaminC" },
  vitaminD: { label: "Vitamin D", unit: "µg", slug: "VitaminD" },
  vitaminB12: { label: "Vitamin B12", unit: "µg", slug: "VitaminB12" },
  folate: { label: "Folate", unit: "µg DFE", slug: "Folate" },
};
export function reference(
  p: Profile | null,
  k: Nutrient,
): { value: number; kind: "RDA" | "AI" | "CDRR" } | null {
  if (!p || p.age < 19 || p.special || p.sex === "unspecified") return null;
  const m = p.sex === "male",
    a = p.age;
  const values: Partial<Record<Nutrient, number>> = {
    calcium: a > 70 || (!m && a > 50) ? 1200 : 1000,
    iron: (m || a > 50 ? 8 : 18) * (p.vegetarian ? 1.8 : 1),
    magnesium: m ? (a < 31 ? 400 : 420) : a < 31 ? 310 : 320,
    potassium: m ? 3400 : 2600,
    sodium: 2300,
    zinc: m ? 11 : 8,
    vitaminA: m ? 900 : 700,
    vitaminC: m ? 90 : 75,
    vitaminD: a > 70 ? 20 : 15,
    vitaminB12: 2.4,
    folate: 400,
    fibre: m ? (a > 50 ? 30 : 38) : a > 50 ? 21 : 25,
  };
  return values[k] === undefined
    ? null
    : {
        value: values[k]!,
        kind:
          k === "sodium"
            ? "CDRR"
            : k === "potassium" || k === "fibre"
              ? "AI"
              : "RDA",
      };
}
