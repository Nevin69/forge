"use client";
import { useState } from "react";
import { Plus, ShoppingBasket, Trash2, Download } from "lucide-react";
import { uid, totals, targetsForDate } from "@/lib/nutrition/calculations";
import type { Food } from "@/lib/nutrition/types";
import { download } from "@/lib/storage";
import { useFoods } from "./FoodFinder";
import { useApp, Button, Field, format, Modal } from "./common";
export default function Planner() {
  const { data, save, date, notify } = useApp();
  const foods = useFoods();
  const [preference, setPreference] = useState(
    data.profile?.vegetarian ? "Vegetarian" : "All foods",
  );
  const [focus, setFocus] = useState<"protein" | "fibre">("protein");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [price, setPrice] = useState("");
  const t = totals(
    data.entries.filter((e) => e.date === date).map((e) => e.nutrients),
  );
  const target = targetsForDate(data, date);
  const remaining = target
    ? Math.max(0, target[focus] - (t[focus].value ?? 0))
    : null;
  const results = foods
    .filter(
      (f) =>
        (preference === "All foods" ||
          (preference === "Vegetarian" && f.vegetarian) ||
          (preference === "Non-vegetarian" && !f.vegetarian)) &&
        f.name.toLowerCase().includes(query.toLowerCase()) &&
        (f.nutrients[focus] ?? 0) > 0,
    )
    .sort(
      (a, b) =>
        (b.nutrients[focus] ?? 0) / b.basis -
        (a.nutrients[focus] ?? 0) / a.basis,
    );
  async function add() {
    if (!selected) return;
    const recipe = data.recipes.find((r) => r.id === selected.id);
    const items = recipe
      ? recipe.ingredients.map((i) => ({
          id: uid(),
          foodId: i.food.id,
          name: i.food.name,
          grams: (i.grams * grams) / recipe.yieldGrams,
          price: null,
          checked: false,
        }))
      : [
          {
            id: uid(),
            foodId: selected.id,
            name: selected.name,
            grams,
            price: price === "" ? null : +price,
            checked: false,
          },
        ];
    if (await save((d) => ({ ...d, shopping: [...d.shopping, ...items] }))) {
      setSelected(null);
      notify(
        recipe
          ? "Recipe ingredients added at the selected yield."
          : "Added to shopping list.",
      );
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FROM PANTRY TO PROGRESS</div>
          <h1>
            A little <em>food for thought.</em>
          </h1>
          <p>Find useful ingredients. Make a flexible list. Cook your way.</p>
        </div>
      </div>
      <div className="planner-grid">
        <section>
          <div className="panel planning-controls">
            <div className="form-grid">
              <Field label="Food preference">
                <select
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                >
                  {["All foods", "Vegetarian", "Non-vegetarian"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Find a source of">
                <select
                  value={focus}
                  onChange={(e) =>
                    setFocus(e.target.value as "protein" | "fibre")
                  }
                >
                  <option value="protein">Protein</option>
                  <option value="fibre">Fibre</option>
                </select>
              </Field>
            </div>
            <Field label="Search foods or recipes">
              <input
                value={query}
                placeholder="e.g. chana"
                onChange={(e) => setQuery(e.target.value)}
              />
            </Field>
            <p className="notice">
              {target
                ? `${format(remaining, 1)} g ${focus} remaining on ${date}${t[focus].partial ? " (based on partial data)" : ""}.`
                : "Set a target to see what remains."}{" "}
              These are food ideas, not a prescribed diet. Values below are per
              100 g, not serving recommendations.
            </p>
          </div>
          <div className="planning-foods">
            {results.length ? (
              results.map((f) => (
                <article className="panel custom-row" key={f.id}>
                  <div>
                    <h3>{f.name}</h3>
                    <p className="muted">
                      <b>
                        {format(
                          f.nutrients[focus] === null
                            ? null
                            : (f.nutrients[focus]! / f.basis) * 100,
                          1,
                        )}{" "}
                        g {focus}
                      </b>{" "}
                      ·{" "}
                      {format(
                        f.nutrients.calories === null
                          ? null
                          : (f.nutrients.calories / f.basis) * 100,
                      )}{" "}
                      kcal / 100 g
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={"Add " + f.name + " to shopping list"}
                    onClick={() => {
                      setSelected(f);
                      setGrams(f.category === "Recipes" ? f.basis : 100);
                      setPrice("");
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </article>
              ))
            ) : (
              <p className="empty panel">
                No matching foods with known {focus}. Try another filter.
              </p>
            )}
          </div>
        </section>
        <section className="panel shopping">
          <h2>
            <ShoppingBasket size={23} /> Your shopping list
          </h2>
          <p className="small muted">
            No live prices or availability claims. Enter your own price per kg.
            Recipe ingredients retain their raw/cooked basis; cooked weights are
            not automatically converted to dry purchase weights.
          </p>
          {data.shopping.length ? (
            data.shopping.map((s) => (
              <div className="shopping-item" key={s.id}>
                <label className={"check " + (s.checked ? "checked" : "")}>
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      save((d) => ({
                        ...d,
                        shopping: d.shopping.map((i) =>
                          i.id === s.id ? { ...i, checked } : i,
                        ),
                      }));
                    }}
                  />
                  <span>
                    {s.name}
                    <small>
                      {format(s.grams, 1)} g{" "}
                      {s.price !== null
                        ? `· est. ₹${format((s.price * s.grams) / 1000, 2)}`
                        : "· price unknown"}
                    </small>
                  </span>
                </label>
                <button
                  className="icon-button"
                  aria-label={"Remove shopping item " + s.name}
                  onClick={() =>
                    save((d) => ({
                      ...d,
                      shopping: d.shopping.filter((i) => i.id !== s.id),
                    }))
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty">
              <ShoppingBasket size={32} />
              <p>A useful list starts with one ingredient.</p>
            </div>
          )}
          {data.shopping.length > 0 && (
            <>
              <p className="shop-total">
                Known-price subtotal{" "}
                <b>
                  ₹
                  {format(
                    data.shopping.reduce(
                      (s, i) => s + ((i.price ?? 0) * i.grams) / 1000,
                      0,
                    ),
                    2,
                  )}
                </b>
              </p>
              <p className="small muted">
                {data.shopping.filter((i) => i.price === null).length} items
                have no price. This is not a complete cost estimate.
              </p>
              <Button
                secondary
                onClick={() =>
                  download(
                    "forge-shopping-list.txt",
                    data.shopping
                      .map(
                        (i) =>
                          `${i.checked ? "[x]" : "[ ]"} ${i.name} — ${format(i.grams, 1)} g${i.price !== null ? ` — ₹${i.price}/kg` : ""}`,
                      )
                      .join("\n"),
                    "text/plain",
                  )
                }
              >
                <Download size={16} /> Download list
              </Button>
              <button
                className="text-button"
                disabled={!data.shopping.some((i) => i.checked)}
                onClick={() =>
                  save((d) => ({
                    ...d,
                    shopping: d.shopping.filter((i) => !i.checked),
                  }))
                }
              >
                Remove checked items
              </button>
            </>
          )}
        </section>
      </div>
      {selected && (
        <Modal
          title="Add to your shopping list"
          close={() => setSelected(null)}
        >
          <h3>{selected.name}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <Field
              label={
                selected.category === "Recipes"
                  ? "Finished recipe amount (grams)"
                  : "Amount (grams)"
              }
            >
              <input
                required
                type="number"
                min="0.1"
                max="100000"
                step="any"
                value={grams}
                onChange={(e) => setGrams(+e.target.value)}
              />
            </Field>
            {selected.category !== "Recipes" && (
              <Field label="Your local price per kg (₹, optional)">
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
            )}
            {selected.category === "Recipes" && (
              <p className="notice">
                Adds each stored ingredient in proportion to the finished
                amount. Ingredient prices remain unknown.
              </p>
            )}
            <Button type="submit">Add to list</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
