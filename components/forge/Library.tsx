"use client";
import { useState } from "react";
import { Plus, Utensils, Pencil, Trash2, BookOpen } from "lucide-react";
import {
  emptyNutrients,
  nutrientKeys,
  type Food,
  type Recipe,
} from "@/lib/nutrition/types";
import { recipeFood, uid } from "@/lib/nutrition/calculations";
import { nutrientInfo } from "@/lib/nutrition/references";
import {
  useApp,
  Button,
  Modal,
  Field,
  NutrientPreview,
  format,
} from "./common";
import FoodFinder from "./FoodFinder";
export default function Library() {
  const { data, save, notify } = useApp();
  const [tab, setTab] = useState("Recipes");
  const [food, setFood] = useState<Food | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredient, setIngredient] = useState(false);
  const [finder, setFinder] = useState<string | null>(null);
  const [remove, setRemove] = useState<{
    kind: "foods" | "recipes" | "savedMeals";
    id: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function newFood() {
    setFood({
      id: uid(),
      name: "",
      description: "Package label",
      category: "Custom foods",
      vegetarian: true,
      basis: 100,
      nutrients: emptyNutrients(),
      source: "Your package label",
      sourceUrl: "",
      measures: [],
      custom: true,
    });
    setError("");
  }
  function newRecipe() {
    setRecipe({
      id: uid(),
      name: "",
      ingredients: [],
      yieldGrams: 0,
      servings: 1,
      updatedAt: new Date().toISOString(),
    });
    setError("");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR KITCHEN, YOUR WAY</div>
          <h1>
            Make it <em>your own.</em>
          </h1>
          <p>Package labels, homemade recipes, and meals worth repeating.</p>
        </div>
        <Button onClick={tab === "Custom foods" ? newFood : newRecipe}>
          <Plus size={18} />
          {tab === "Custom foods" ? "Custom food" : "Create recipe"}
        </Button>
      </div>
      <div className="tabs">
        {["Recipes", "Custom foods", "Saved meals"].map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            <span>
              {t === "Recipes"
                ? data.recipes.length
                : t === "Custom foods"
                  ? data.foods.length
                  : data.savedMeals.length}
            </span>
          </button>
        ))}
      </div>
      {tab === "Recipes" && (
        <>
          {data.recipes.length === 0 ? (
            <div className="empty panel kitchen-empty">
              <Utensils size={38} />
              <h2>A recipe for your routine.</h2>
              <p>
                Add each ingredient, including oils. Weigh the finished dish and
                log only your portion.
              </p>
              <Button onClick={newRecipe}>Build your first recipe</Button>
            </div>
          ) : (
            <div className="library-grid">
              {data.recipes.map((r) => {
                const f = recipeFood(r);
                return (
                  <article className="panel library-card" key={r.id}>
                    <span className="recipe-icon">
                      <Utensils size={28} />
                    </span>
                    <h2>{r.name}</h2>
                    <p className="muted">
                      {r.ingredients.length} ingredients ·{" "}
                      {format(r.yieldGrams)} g yield · {r.servings} servings
                    </p>
                    <p>
                      <b>
                        {format(
                          f.nutrients.calories === null
                            ? null
                            : f.nutrients.calories / r.servings,
                        )}
                      </b>{" "}
                      kcal / serving
                    </p>
                    <div className="actions">
                      <Button secondary onClick={() => setFinder(r.id)}>
                        Log a portion
                      </Button>
                      <button
                        className="icon-button"
                        aria-label={"Edit " + r.name}
                        onClick={() => {
                          setRecipe(structuredClone(r));
                          setError("");
                        }}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={"Delete " + r.name}
                        onClick={() =>
                          setRemove({ kind: "recipes", id: r.id, name: r.name })
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <p className="notice">
            Recipe edits affect future logging. Past diary entries and saved
            meal portions keep their original nutrition. Cooking losses and
            discarded water are not modelled.
          </p>
        </>
      )}
      {tab === "Custom foods" && (
        <>
          {data.foods.length === 0 ? (
            <div className="empty panel">
              <BookOpen size={36} />
              <h2>Read the label. Make it count.</h2>
              <p>
                Add your usual paneer, bread, protein powder or packaged snack
                from its current nutrition label.
              </p>
              <Button onClick={newFood}>Add a package label</Button>
            </div>
          ) : (
            data.foods.map((f) => (
              <article className="panel custom-row" key={f.id}>
                <div>
                  <h3>{f.name}</h3>
                  <p className="muted">
                    {format(f.nutrients.calories)} kcal per {f.basis} g label
                    serving
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={"Edit " + f.name}
                  onClick={() => setFood(structuredClone(f))}
                >
                  <Pencil size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"Delete " + f.name}
                  onClick={() =>
                    setRemove({ kind: "foods", id: f.id, name: f.name })
                  }
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))
          )}
        </>
      )}
      {tab === "Saved meals" && (
        <>
          {data.savedMeals.length === 0 ? (
            <div className="empty panel">
              <h2>Your repeat orders live here.</h2>
              <p>
                Use “Save meal” in the food diary after logging a meal you eat
                often.
              </p>
            </div>
          ) : (
            data.savedMeals.map((m) => (
              <article className="panel custom-row" key={m.id}>
                <div>
                  <h3>{m.name}</h3>
                  <p className="muted">
                    {m.entries
                      .map((e) => `${e.name} (${format(e.grams)} g)`)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={"Delete " + m.name}
                  onClick={() =>
                    setRemove({ kind: "savedMeals", id: m.id, name: m.name })
                  }
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))
          )}
          <p className="small muted">
            Log these from “Saved meals” in the diary. Each saved meal is an
            independent snapshot.
          </p>
        </>
      )}
      {food && (
        <Modal
          title={
            data.foods.some((f) => f.id === food.id)
              ? "Edit custom food"
              : "Add a package label"
          }
          close={() => setFood(null)}
          wide
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              if (
                await save((d) => ({
                  ...d,
                  foods: [
                    ...d.foods.filter((f) => f.id !== food.id),
                    {
                      ...food,
                      name: food.name.trim(),
                      source: food.source.trim() || "Your package label",
                      measures: [{ name: "label serving", grams: food.basis }],
                    },
                  ],
                }))
              ) {
                setFood(null);
                notify("Food label saved.");
              }
              setBusy(false);
            }}
          >
            <div className="form-grid">
              <Field label="Food and brand">
                <input
                  required
                  maxLength={150}
                  value={food.name}
                  onChange={(e) => setFood({ ...food, name: e.target.value })}
                />
              </Field>
              <Field
                label="Label serving size (grams)"
                hint="If values are per 100 g, enter 100. Weighed grams only; do not assume 1 ml = 1 g."
              >
                <input
                  type="number"
                  required
                  min="0.1"
                  max="10000"
                  step="any"
                  value={food.basis}
                  onChange={(e) => setFood({ ...food, basis: +e.target.value })}
                />
              </Field>
            </div>
            <Field label="Source / label notes">
              <input
                required
                maxLength={500}
                value={food.source}
                onChange={(e) => setFood({ ...food, source: e.target.value })}
              />
            </Field>
            <label className="check">
              <input
                type="checkbox"
                checked={food.vegetarian}
                onChange={(e) =>
                  setFood({ ...food, vegetarian: e.target.checked })
                }
              />{" "}
              Vegetarian (dairy included; eggs excluded)
            </label>
            <p className="notice">
              Enter amounts per the label serving above. Leave missing values
              blank, not zero. Enter folate only in µg DFE and vitamin A only in
              µg RAE; leave them blank if your label uses another form.
            </p>
            <div className="form-grid nutrient-form">
              {nutrientKeys.map((k) => (
                <Field
                  key={k}
                  label={`${nutrientInfo[k].label} (${nutrientInfo[k].unit})`}
                >
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="any"
                    required={k === "calories"}
                    placeholder="Unknown"
                    value={food.nutrients[k] ?? ""}
                    onChange={(e) =>
                      setFood({
                        ...food,
                        nutrients: {
                          ...food.nutrients,
                          [k]: e.target.value === "" ? null : +e.target.value,
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <Button type="submit" disabled={!food.name.trim() || busy}>
              Save food
            </Button>
          </form>
        </Modal>
      )}
      {recipe && (
        <Modal
          title={
            data.recipes.some((r) => r.id === recipe.id)
              ? "Edit your recipe"
              : "A new homemade favourite"
          }
          close={() => setRecipe(null)}
          wide
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!recipe.ingredients.length) {
                setError("Add at least one ingredient.");
                return;
              }
              setBusy(true);
              if (
                await save((d) => ({
                  ...d,
                  recipes: [
                    ...d.recipes.filter((r) => r.id !== recipe.id),
                    {
                      ...recipe,
                      name: recipe.name.trim(),
                      updatedAt: new Date().toISOString(),
                    },
                  ],
                }))
              ) {
                setRecipe(null);
                notify("Recipe saved. Past diary entries are unchanged.");
              }
              setBusy(false);
            }}
          >
            <Field label="Recipe name">
              <input
                required
                maxLength={150}
                placeholder="e.g. My everyday dal"
                value={recipe.name}
                onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
              />
            </Field>
            <h3>Ingredients</h3>
            <p className="muted small">
              Match raw or cooked entries to what you weigh. Include oil, ghee,
              salt and other additions. Nested recipes are stored as snapshots.
            </p>
            {recipe.ingredients.map((i, index) => (
              <div className="ingredient-row" key={index}>
                <span>{i.food.name}</span>
                <label>
                  <span className="sr-only">Grams of {i.food.name}</span>
                  <input
                    required
                    type="number"
                    min="0.1"
                    max="100000"
                    step="any"
                    value={i.grams}
                    onChange={(e) =>
                      setRecipe({
                        ...recipe,
                        ingredients: recipe.ingredients.map((v, j) =>
                          index === j ? { ...v, grams: +e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <span>g</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={"Remove " + i.food.name}
                  onClick={() =>
                    setRecipe({
                      ...recipe,
                      ingredients: recipe.ingredients.filter(
                        (_, j) => j !== index,
                      ),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <Button secondary type="button" onClick={() => setIngredient(true)}>
              <Plus size={17} /> Add ingredient
            </Button>
            <div className="form-grid recipe-yield">
              <Field
                label="Finished recipe weight (grams)"
                hint="Weigh the finished edible dish after cooking. Water changes weight, not ingredient calories."
              >
                <input
                  required
                  type="number"
                  min="0.1"
                  max="1000000"
                  step="any"
                  value={recipe.yieldGrams || ""}
                  onChange={(e) =>
                    setRecipe({ ...recipe, yieldGrams: +e.target.value })
                  }
                />
              </Field>
              <Field
                label="Number of servings"
                hint="A serving is finished weight ÷ servings; you can always log grams."
              >
                <input
                  required
                  type="number"
                  min="0.1"
                  max="10000"
                  step="any"
                  value={recipe.servings}
                  onChange={(e) =>
                    setRecipe({ ...recipe, servings: +e.target.value })
                  }
                />
              </Field>
            </div>
            {recipe.yieldGrams > 0 &&
              recipe.servings > 0 &&
              recipe.ingredients.length > 0 &&
              recipe.ingredients.every((i) => i.grams > 0) && (
                <>
                  <h3>Whole recipe</h3>
                  <NutrientPreview n={recipeFood(recipe).nutrients} />
                  <p className="small">
                    One serving ={" "}
                    {format(recipe.yieldGrams / recipe.servings, 1)} g. Unknown
                    ingredient nutrients remain unknown for the recipe.
                  </p>
                </>
              )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <Button type="submit" disabled={!recipe.name.trim() || busy}>
              Save recipe
            </Button>
          </form>
        </Modal>
      )}
      {ingredient && recipe && (
        <FoodFinder
          close={() => setIngredient(false)}
          onIngredient={(food, grams) =>
            setRecipe({
              ...recipe,
              ingredients: [
                ...recipe.ingredients,
                { food: structuredClone(food), grams },
              ],
            })
          }
        />
      )}{" "}
      {finder && (
        <FoodFinder initialFoodId={finder} close={() => setFinder(null)} />
      )}
      {remove && (
        <Modal title="Delete from your kitchen?" close={() => setRemove(null)}>
          <p>
            {remove.name} will be removed. Historical diary entries, recipes
            using ingredient snapshots, and saved meal nutrition stay intact.
          </p>
          <Button
            onClick={async () => {
              if (
                await save((d) => ({
                  ...d,
                  [remove.kind]: d[remove.kind].filter(
                    (x) => x.id !== remove.id,
                  ),
                }))
              )
                setRemove(null);
            }}
          >
            Delete
          </Button>
        </Modal>
      )}
    </>
  );
}
