# Forge — your everyday nutrition journal

Forge is a free, device-local nutrition tracker built with React and TypeScript. It helps adults estimate energy needs, log familiar foods, build recipes, and review body-weight and intake trends. There are no paid nutrition APIs, app accounts, analytics, or subscription features.

## Run it

Install Node.js 22.13 or newer (Node includes npm). In a terminal:

```sh
cd "/Users/nevinjojo7/DIET TRACKER/forge"
npm ci
npm run dev
```

Open the local address printed in the terminal (normally `http://localhost:5173`). Keep using the same address, port and browser: `localhost`, `127.0.0.1`, and a hosted address have separate browser storage.

```sh
npm run typecheck   # check TypeScript
npm test            # consequential logic and IndexedDB tests
npm run build       # production build
npm start           # serve the production Worker locally
```

The project uses the Sites React/Vinext starter: Next-style pages built with Vite. You do not need a Cloudflare account to run the development app. The optional private Sites preview has a hosting access check; the local app needs no account. No health information is sent to the host.

## Using your journal

1. Choose **Start tracking**, replace the labelled example setup values, and choose your goal. You may decline the equation parameter and use the diary without generated targets.
2. Use **Add food**, check raw/cooked preparation, enter weighed grams, preview the nutrients, and select a meal. A source-supported household measure fills in its gram weight.
3. In **My kitchen**, enter package-label values or make a recipe. Add every ingredient, including oil and salt; weigh the finished recipe. Servings divide this final yield. For recipes where cooking liquid or whey is discarded, simple ingredient addition may overestimate retained nutrients.
4. **Progress** shows only your logged data. Unlogged days are gaps. Log one daily weight, optionally with a note, and review weekly averages.
5. **Settings** contains editable targets, reduced motion, backups, CSV downloads, validated JSON import, and a reset requiring the word RESET.

## Where to change things

| File or folder                  | What it does                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `lib/brand.ts`                  | App name and tagline. Also update the title in `app/layout.tsx` and the simple favicon when rebranding.        |
| `components/forge/`             | Separate React components for setup, dashboard/diary, food search, kitchen, progress, planning and settings.   |
| `app/globals.css`               | Colours, typography, responsive layouts and accessible motion rules.                                           |
| `lib/nutrition/calculations.ts` | Energy estimates, portion scaling, totals, recipe conversion, dates and target history.                        |
| `lib/nutrition/types.ts`        | The shape of app data, foods, recipes and diary entries.                                                       |
| `lib/nutrition/foods.json`      | The offline food catalogue, with source URLs, exact descriptions and supported gram conversions.               |
| `lib/nutrition/references.ts`   | Nutrient units, age/sex reference amounts and scientific links.                                                |
| `lib/storage.ts`                | IndexedDB transactions, backup validation and download helpers.                                                |
| `tests/core.test.ts`            | Automated tests for the calculations and persistence. Synthetic fixtures never populate your personal journal. |
| `public/sw.js`                  | Basic production-only offline caching of the app shell and static assets.                                      |
| `scripts/data/build-foods.py`   | Reproducible extraction from the official USDA CSV archive.                                                    |

## How the numbers work

- Resting energy: Mifflin–St Jeor in kg, cm and years. Intended scope here: healthy adults aged 19–78. The app withholds automatic targets for underweight BMI, pregnancy/breastfeeding, indicated nutrition-related conditions and measurements outside conservative app guardrails. BMI is only a screening measure.
- Maintenance: resting estimate × a 1.4, 1.6, 1.8 or 2.1 whole-day activity factor. These are practical approximations informed by FAO PAL categories, originally defined relative to basal metabolism. Gym activity is included once, never added as exercise calories.
- Goal: +5% for muscle gain, −10% for fat loss, no change for maintenance. These are conservative starting choices, not promises or clinical prescriptions. Automatic low estimates under 1,200 kcal (female parameter) or 1,500 kcal (male parameter) are withheld; these thresholds do not imply universal safe minimums.
- Protein: 1.6 g/kg for the supported healthy resistance-training population. Fat: 30% of calories. Carbohydrate: remaining energy. Manual targets show energy conflicts using 4/4/9 kcal per gram. Needs during an energy deficit can differ from the protein study population.
- Micronutrients: NIH/National Academies US/Canadian adult RDA or AI values, adjusted for age and study sex parameter. Sodium uses a 2,300 mg CDRR threshold, not a target to reach. Vegetarian iron is adjusted 1.8×. Vitamin A uses µg RAE, folate µg DFE, vitamin D and B12 µg; minerals and C use mg. These references are not a medical diet or a supplement recommendation.
- Missing values are `null`, never silently zero. Daily totals report coverage. A recipe with missing data for a nutrient marks that recipe nutrient unknown rather than implying completeness.
- Diary entries store both original per-basis nutrients and scaled totals. Editing a food or recipe later cannot change historical entries. Saved meals and recipe ingredients also retain snapshots. Target changes have their own effective-date history.

All these assumptions and links are also explained in the app’s **How we calculate this** panel.

## Sources

- [Mifflin & St Jeor, 1990](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- [FAO/WHO/UNU adult energy and activity levels](https://www.fao.org/4/y5686e/y5686e07.htm)
- [Morton et al., resistance-training protein meta-analysis, 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5867436/)
- [Helms et al., small and large energy surpluses, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10620361/)
- [Garthe et al., gradual weight loss in athletes, 2011](https://pubmed.ncbi.nlm.nih.gov/21558571/)
- [AHA/ACC/TOS adult weight-management guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/)
- [USDA FoodData Central SR Legacy download](https://fdc.nal.usda.gov/download-datasets/)
- [Sabar Dairy / Amul Fresh Paneer product specification](https://sabardairy.org/product/amul-fresh-paneer/)
- [NIH nutrient fact sheets](https://ods.od.nih.gov/factsheets/list-VitaminsMinerals/)
- [National Academies sodium reference](https://www.nationalacademies.org/read/25353/chapter/13)
- [USDA macronutrient reference resources](https://www.nal.usda.gov/human-nutrition-and-food-safety/food-composition/macronutrients)

## Food coverage and remaining limits

The initial catalogue contains **45 foods**: 44 USDA SR Legacy records and one manufacturer-sourced paneer label reference. It prioritises rice, atta, commercial roti, oats, pulses, milk/curd, tofu, eggs, chicken/fish, produce, nuts/seeds, oils and salt. These are not a comprehensive Indian food-composition database. USDA varieties and preparations can differ from Indian products; branded paneer data can change, so compare the current pack. Custom foods and recipes cover your own preparations without fabricated universal bowl or plate sizes.

Recipes currently need a weighed final yield to support reliable gram logging; serving counts are then an optional convenience. Cooking-retention factors, discarded cooking water/whey, ingredient absorption, barcode scanning, restaurant menus and automatic food recognition are not modelled. Ingredient snapshots inside an existing recipe must be replaced to use a newly edited custom food. Shopping lists do not infer raw purchase weights from cooked weights or fetch prices/availability. The app supports gym nutrition and records gym frequency; it does not log exercise sets or repetitions.

No face-fat targeting, face score, dehydration plan or transformation timeline is included. Review overall body trends, recovery and training support.

## Storage, privacy and offline use

IndexedDB saves each change in an atomic transaction; concurrent changes read the latest saved data. Failure messages do not silently replace your journal with an empty one. JSON imports are schema-checked, validate nutrient snapshots and show a replacement preview. CSV blank nutrient cells mean unknown; spreadsheet formula prefixes are escaped.

Your health data stays on your device. Browser storage is not an encrypted medical vault and is not synced across devices. Clearing site data, private browsing or browser eviction can remove it. Keep JSON backups. A persistent-storage request is available, but the browser decides whether to grant it.

The production service worker caches only the application shell and same-origin assets after the first successful load. Basic offline navigation and logging should work after caching finishes. First use, external scientific sources and uncached updates require connectivity. Development mode deliberately disables service workers to avoid stale code. Cache availability and private hosting access policies depend on the browser and host.

For isolated manual testing, append `?qa=1` before the hash. The yellow TEST JOURNAL banner identifies a separate IndexedDB database; test entries never appear in the normal personal journal. No sample data is automatically seeded.

## Assets

The dumbbell/forearm hero is an original AI-generated PNG made for this project. The cream serif typography uses system fonts; icons use Lucide. No reference branding or marketing copy was reused. The described burgundy visual direction was followed because no attached reference image was available to inspect.
