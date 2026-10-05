"use client";
import { useMemo, useState } from "react";
import { Search, Star, Plus } from "lucide-react";
import rawFoods from "@/lib/nutrition/foods.json";
import { meals, type Food, type Meal } from "@/lib/nutrition/types";
import { makeEntry, recipeFood, scale } from "@/lib/nutrition/calculations";
import {
  useApp,
  Modal,
  Field,
  Button,
  NutrientPreview,
  format,
} from "./common";
export const baseFoods = rawFoods as Food[];
export function useFoods() {
  const { data } = useApp();
  return useMemo(
    () => [...baseFoods, ...data.foods, ...data.recipes.map(recipeFood)],
    [data.foods, data.recipes],
  );
}
export default function FoodFinder({
  close,
  initialMeal = "Breakfast",
  initialFoodId,
  onIngredient,
}: {
  close: () => void;
  initialMeal?: Meal;
  initialFoodId?: string;
  onIngredient?: (food: Food, grams: number) => void;
}) {
  const { data, save, date, notify } = useApp();
  const foods = useFoods();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All foods");
  const [selected, select] = useState<Food | null>(
    foods.find((f) => f.id === initialFoodId) ?? null,
  );
  const [grams, setGrams] = useState("100");
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [measure, setMeasure] = useState("grams");
  const [busy, setBusy] = useState(false);
  const q = query.toLowerCase().trim();
  const filtered = foods.filter(
    (f) =>
      (category === "All foods" ||
        (category === "Favourites" && data.favourites.includes(f.id)) ||
        (category === "Recent" && data.recent.includes(f.id)) ||
        f.category === category) &&
      `${f.name} ${f.description}`.toLowerCase().includes(q),
  );
  const valid = +grams > 0 && +grams <= 100000 && Number.isFinite(+grams);
  async function add() {
    if (!selected || !valid) return;
    if (onIngredient) {
      onIngredient(selected, +grams);
      close();
      return;
    }
    setBusy(true);
    const e = makeEntry(selected, +grams, date, meal);
    if (
      await save((d) => ({
        ...d,
        entries: [...d.entries, e],
        recent: [
          selected.id,
          ...d.recent.filter((id) => id !== selected.id),
        ].slice(0, 30),
      }))
    ) {
      notify(`${selected.name} added to ${meal.toLowerCase()}.`);
      close();
    }
    setBusy(false);
  }
  return (
    <Modal
      title={onIngredient ? "Add an ingredient" : "Find your food"}
      close={close}
      wide
    >
      <p className="muted">
        {onIngredient
          ? "Weigh each ingredient, including cooking oil."
          : `Logging for ${date}. Nutrition varies with variety, preparation and portion.`}
      </p>
      <div className="search-bar">
        <Search size={20} />
        <input
          autoFocus
          aria-label="Search foods"
          placeholder="Try rice, dal, paneer, eggs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="filter-row">
        <Field label="Browse">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {[
              "All foods",
              "Favourites",
              "Recent",
              ...new Set(foods.map((f) => f.category)),
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <span>{filtered.length} foods</span>
      </div>
      <div className="food-finder">
        <div className="food-results">
          {filtered.length === 0 ? (
            <div className="empty">
              <h3>No matching foods yet.</h3>
              <p>
                Add a package label in My kitchen, or build your own recipe.
              </p>
            </div>
          ) : (
            filtered.map((f) => (
              <div
                className={
                  "food-result " + (selected?.id === f.id ? "chosen" : "")
                }
                key={f.id}
              >
                <button
                  onClick={() => {
                    select(f);
                    setGrams("100");
                    setMeasure("grams");
                  }}
                >
                  <span className="food-initial">{f.name.slice(0, 1)}</span>
                  <span>
                    <strong>{f.name}</strong>
                    <small>
                      {f.category} ·{" "}
                      {format(
                        f.nutrients.calories === null
                          ? null
                          : (f.nutrients.calories / f.basis) * 100,
                      )}{" "}
                      kcal / 100 g
                    </small>
                  </span>
                  <Plus size={17} />
                </button>
                <button
                  className="icon-button favourite"
                  aria-label={
                    (data.favourites.includes(f.id)
                      ? "Unfavourite "
                      : "Favourite ") + f.name
                  }
                  aria-pressed={data.favourites.includes(f.id)}
                  onClick={() =>
                    save((d) => ({
                      ...d,
                      favourites: d.favourites.includes(f.id)
                        ? d.favourites.filter((id) => id !== f.id)
                        : [...d.favourites, f.id],
                    }))
                  }
                >
                  <Star
                    size={17}
                    fill={
                      data.favourites.includes(f.id) ? "currentColor" : "none"
                    }
                  />
                </button>
              </div>
            ))
          )}
        </div>
        <section className="food-detail">
          {selected ? (
            <>
              <div className="eyebrow">PORTION PREVIEW</div>
              <h3>{selected.name}</h3>
              <p className="small muted">{selected.description}</p>
              <Field label="Quantity (grams)">
                <input
                  type="number"
                  min="0.1"
                  max="100000"
                  step="any"
                  value={grams}
                  onChange={(e) => {
                    setGrams(e.target.value);
                    setMeasure("grams");
                  }}
                />
              </Field>
              {selected.measures.length > 0 && (
                <Field label="Or use a source-supported measure">
                  <select
                    value={measure}
                    onChange={(e) => {
                      setMeasure(e.target.value);
                      if (e.target.value !== "grams")
                        setGrams(
                          String(selected.measures[+e.target.value].grams),
                        );
                    }}
                  >
                    <option value="grams">Weighed grams (recommended)</option>
                    {selected.measures.map((m, i) => (
                      <option key={i} value={i}>
                        {m.name} = {m.grams} g
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {valid ? (
                <NutrientPreview
                  n={scale(selected.nutrients, +grams, selected.basis)}
                />
              ) : (
                <p className="error">
                  Enter a quantity above 0 and at most 100,000 g.
                </p>
              )}
              {!onIngredient && (
                <Field label="Add to meal">
                  <select
                    value={meal}
                    onChange={(e) => setMeal(e.target.value as Meal)}
                  >
                    {meals.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Button disabled={!valid || busy} onClick={add}>
                {onIngredient ? "Add ingredient" : "Add to diary"}
              </Button>
              <p className="small source">
                {selected.sourceUrl ? (
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                    {selected.source}
                  </a>
                ) : (
                  selected.source
                )}
                <br />
                Nutrients stored per {selected.basis} g. Household measures are
                source estimates, not a standard for every bowl or roti.
              </p>
            </>
          ) : (
            <div className="empty">
              <Search size={30} />
              <h3>Find a familiar favourite.</h3>
              <p>
                Select a food to check its preparation, portion and nutrition
                before logging.
              </p>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
