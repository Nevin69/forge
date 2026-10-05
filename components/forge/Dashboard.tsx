"use client";
import { useState } from "react";
import {
  Plus,
  Droplets,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Pencil,
  Trash2,
  Copy,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  meals,
  nutrientKeys,
  type Entry,
  type Meal,
  type Nutrient,
} from "@/lib/nutrition/types";
import {
  totals,
  targetsForDate,
  today,
  dateShift,
  resizeEntry,
  uid,
} from "@/lib/nutrition/calculations";
import { nutrientInfo, reference } from "@/lib/nutrition/references";
import { useApp, Button, Field, Modal, format, Science } from "./common";
import FoodFinder from "./FoodFinder";
export default function Dashboard({
  diaryOnly = false,
}: {
  diaryOnly?: boolean;
}) {
  const { data, date, setDate, save, notify } = useApp();
  const entries = data.entries.filter((e) => e.date === date);
  const total = totals(entries.map((e) => e.nutrients));
  const target = targetsForDate(data, date);
  const [adding, setAdding] = useState<Meal | null>(null);
  const [edit, setEdit] = useState<Entry | null>(null);
  const [remove, setRemove] = useState<Entry | null>(null);
  const [copy, setCopy] = useState(false);
  const [copyDate, setCopyDate] = useState(dateShift(date, -1));
  const [copyMeal, setCopyMeal] = useState("All meals");
  const [saveMeal, setSaveMeal] = useState<Meal | null>(null);
  const [mealName, setMealName] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedMealId, setSavedMealId] = useState("");
  const [destination, setDestination] = useState<Meal>("Lunch");
  const [water, setWater] = useState("250");
  const waterTotal = data.water[date] ?? 0;
  const cal = total.calories.value;
  const remaining =
    target && cal !== null ? target.calories - cal : (target?.calories ?? null);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {date === today() ? "ONE DAY AT A TIME" : "YOUR DAILY JOURNAL"}
          </div>
          <h1>
            {diaryOnly
              ? "Your food, "
              : date === today()
                ? "Make today "
                : "A day, "}
            <em>
              {diaryOnly
                ? "accounted for."
                : date === today()
                  ? "a good day."
                  : "in perspective."}
            </em>
          </h1>
          <p>
            {diaryOnly
              ? "Every ingredient counts. Every meal is a fresh start."
              : "A little awareness goes a long way."}
          </p>
        </div>
        <Button onClick={() => setAdding("Breakfast")}>
          <Plus size={18} /> Add food
        </Button>
      </div>
      <div className="date-toolbar">
        <div className="date-control">
          <button
            className="icon-button"
            aria-label="Previous day"
            onClick={() => setDate(dateShift(date, -1))}
          >
            <ChevronLeft size={18} />
          </button>
          <input
            aria-label="Diary date"
            type="date"
            max={today()}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
          <button
            className="icon-button"
            aria-label="Next day"
            disabled={date >= today()}
            onClick={() => setDate(dateShift(date, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="actions">
          <button className="text-button" onClick={() => setDate(today())}>
            Today
          </button>
          <button className="text-button" onClick={() => setCopy(true)}>
            <Copy size={15} /> Copy meal or day
          </button>
          <button className="text-button" onClick={() => setSaved(true)}>
            <Bookmark size={15} /> Saved meals
          </button>
        </div>
      </div>
      {!diaryOnly && (
        <>
          <div className="dashboard-grid">
            <section className="panel calorie-card">
              <div className="card-label">
                DAILY ENERGY <span>kcal</span>
              </div>
              <div className="energy-body">
                <div
                  className="energy-ring"
                  style={
                    {
                      "--progress": `${Math.min(100, ((cal ?? 0) / (target?.calories ?? 1)) * 100)}%`,
                    } as React.CSSProperties
                  }
                >
                  <div>
                    <strong>
                      {format(cal ?? (entries.length ? null : 0))}
                    </strong>
                    <span>
                      consumed{total.calories.partial ? " · partial" : ""}
                    </span>
                  </div>
                </div>
                <div className="energy-meta">
                  <span>
                    {remaining !== null && remaining < 0
                      ? "Above target"
                      : "Remaining"}
                  </span>
                  <strong>
                    {format(remaining === null ? null : Math.abs(remaining))}
                  </strong>
                  <small>
                    {target
                      ? `${format(target.calories)} daily target`
                      : "No target set for this date"}
                  </small>
                  {total.calories.partial && (
                    <small>Remaining uses known calories only.</small>
                  )}
                  {entries.length === 0 && <small>Ready when you are.</small>}
                </div>
              </div>
            </section>
            <section className="panel macros-card">
              <div className="card-label">
                BUILDING BLOCKS <span>grams</span>
              </div>
              {(["protein", "carbs", "fat", "fibre"] as const).map((k, i) => (
                <div className={"macro macro-" + i} key={k}>
                  <div>
                    <span>
                      <i />
                      {nutrientInfo[k].label}
                    </span>
                    <span>
                      <b>
                        {format(
                          total[k].value ?? (entries.length ? null : 0),
                          1,
                        )}
                      </b>
                      {target ? ` / ${format(target[k])} g` : " g"}
                      {total[k].partial ? " · partial" : ""}
                    </span>
                  </div>
                  <div className="bar">
                    <span
                      style={{
                        width: `${Math.min(100, ((total[k].value ?? 0) / (target?.[k] ?? 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>
          </div>
          <section className="water-strip">
            <div className="water-title">
              <Droplets size={24} />
              <div>
                <strong>A moment to hydrate</strong>
                <span>
                  {format(waterTotal)} / {format(data.waterGoal)} ml logged
                </span>
              </div>
            </div>
            <div className="water-drops" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <Droplets
                  key={i}
                  size={22}
                  fill={
                    i < Math.min(8, (waterTotal / data.waterGoal) * 8)
                      ? "currentColor"
                      : "none"
                  }
                  opacity={i < (waterTotal / data.waterGoal) * 8 ? 1 : 0.3}
                />
              ))}
            </div>
            <form
              className="water-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  +water > 0 &&
                  +water <= 5000 &&
                  (await save((d) => ({
                    ...d,
                    water: {
                      ...d.water,
                      [date]: (d.water[date] ?? 0) + +water,
                    },
                  })))
                )
                  notify("Water added.");
              }}
            >
              <input
                aria-label="Water amount in millilitres"
                type="number"
                min="1"
                max="5000"
                step="1"
                required
                value={water}
                onChange={(e) => setWater(e.target.value)}
              />
              <Button secondary type="submit">
                <Plus size={15} /> ml
              </Button>
              <button
                type="button"
                className="text-button"
                disabled={waterTotal === 0 || !(+water > 0 && +water <= 5000)}
                onClick={() =>
                  save((d) => ({
                    ...d,
                    water: {
                      ...d.water,
                      [date]: Math.max(0, (d.water[date] ?? 0) - (+water || 0)),
                    },
                  }))
                }
              >
                Remove
              </button>
            </form>
          </section>
        </>
      )}
      <div className="section-title">
        <h2>{diaryOnly ? "Meal diary" : "On the menu"}</h2>
        <span>
          {entries.length} {entries.length === 1 ? "entry" : "entries"} logged
        </span>
      </div>
      <div className="meal-grid">
        {meals.map((meal, i) => {
          const mealEntries = entries.filter((e) => e.meal === meal),
            t = totals(mealEntries.map((e) => e.nutrients));
          const Icon = [Sun, Sunset, Moon, Coffee][i];
          return (
            <section className="panel meal-card" key={meal}>
              <header>
                <div>
                  <Icon size={20} />
                  <h3>{meal}</h3>
                </div>
                <span>
                  {format(t.calories.value ?? (mealEntries.length ? null : 0))}{" "}
                  kcal{t.calories.partial ? " · partial" : ""}
                </span>
              </header>
              {mealEntries.length ? (
                mealEntries.map((e) => (
                  <div className="diary-entry" key={e.id}>
                    <div>
                      <strong>{e.name}</strong>
                      <small>
                        {format(e.grams, 1)} g · {format(e.nutrients.calories)}{" "}
                        kcal · {format(e.nutrients.protein, 1)} g protein
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={"Edit " + e.name}
                      onClick={() => setEdit(structuredClone(e))}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"Delete " + e.name}
                      onClick={() => setRemove(e)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="meal-empty">Nothing here yet. What’s cooking?</p>
              )}
              <div className="meal-footer">
                <button className="text-button" onClick={() => setAdding(meal)}>
                  <Plus size={16} /> Add food
                </button>
                {mealEntries.length > 0 && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setSaveMeal(meal);
                      setMealName(meal + " favourites");
                    }}
                  >
                    <Bookmark size={15} /> Save meal
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <section className="panel micro-panel">
        <details>
          <summary>
            <h2>The smaller essentials</h2>
            <span>Vitamins & minerals</span>
          </summary>
          <p className="muted">
            Known amounts are shown below. Partial or unknown data cannot
            establish whether your needs are met. Reference values describe
            usual intake over time; they are not scores to maximise.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nutrient</th>
                  <th>Logged amount</th>
                  <th>Daily reference</th>
                  <th>Data coverage</th>
                </tr>
              </thead>
              <tbody>
                {nutrientKeys.slice(5).map((k) => {
                  const info = nutrientInfo[k],
                    ref = reference(data.profile, k);
                  return (
                    <tr key={k}>
                      <td>
                        {info.slug ? (
                          <a
                            href={`https://ods.od.nih.gov/factsheets/${info.slug}-HealthProfessional/`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {info.label}
                          </a>
                        ) : (
                          <a
                            href="https://www.nationalacademies.org/read/25353/chapter/13"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {info.label}
                          </a>
                        )}
                      </td>
                      <td>
                        {format(total[k].value, 1)}{" "}
                        {total[k].value === null ? "" : info.unit}
                      </td>
                      <td>
                        {ref
                          ? `${format(ref.value, 1)} ${info.unit} · ${ref.kind}`
                          : "Not personalised"}
                      </td>
                      <td>
                        {entries.length === 0
                          ? "No food logged"
                          : total[k].known === 0
                            ? "Unknown"
                            : total[k].partial
                              ? `Partial data · ${total[k].known}/${entries.length} entries`
                              : "All entries have data"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="small muted">
            RDA = recommended dietary allowance. AI = adequate intake. Sodium
            CDRR = reduce intake above this level, not a minimum. Vitamin A uses
            RAE and folate uses DFE, not interchangeable label units. Vegetarian
            iron reference is adjusted 1.8×.
          </p>
        </details>
      </section>
      <Science />
      {adding && (
        <FoodFinder initialMeal={adding} close={() => setAdding(null)} />
      )}{" "}
      {edit && (
        <Modal title="Edit diary entry" close={() => setEdit(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save((d) => ({
                  ...d,
                  entries: d.entries.map((x) =>
                    x.id === edit.id ? resizeEntry(edit, edit.grams) : x,
                  ),
                }))
              )
                setEdit(null);
            }}
          >
            <h3>{edit.name}</h3>
            <p className="muted small">
              Uses the nutrition snapshot saved when this entry was logged.
            </p>
            <Field label="Quantity (grams)">
              <input
                type="number"
                required
                min="0.1"
                max="100000"
                step="any"
                value={edit.grams}
                onChange={(e) => setEdit({ ...edit, grams: +e.target.value })}
              />
            </Field>
            <Field label="Meal">
              <select
                value={edit.meal}
                onChange={(e) =>
                  setEdit({ ...edit, meal: e.target.value as Meal })
                }
              >
                {meals.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                required
                max={today()}
                value={edit.date}
                onChange={(e) => setEdit({ ...edit, date: e.target.value })}
              />
            </Field>
            <Button type="submit">Save entry</Button>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Remove this entry?" close={() => setRemove(null)}>
          <p>
            {remove.name}, {format(remove.grams, 1)} g will be removed from your
            diary.
          </p>
          <Button
            onClick={async () => {
              if (
                await save((d) => ({
                  ...d,
                  entries: d.entries.filter((e) => e.id !== remove.id),
                }))
              )
                setRemove(null);
            }}
          >
            Delete entry
          </Button>
        </Modal>
      )}
      {copy && (
        <Modal title="Bring a meal forward" close={() => setCopy(false)}>
          <Field label="Copy from date">
            <input
              type="date"
              max={today()}
              value={copyDate}
              onChange={(e) => setCopyDate(e.target.value)}
            />
          </Field>
          <Field label="What to copy">
            <select
              value={copyMeal}
              onChange={(e) => setCopyMeal(e.target.value)}
            >
              {["All meals", ...meals].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <p className="notice">
            {
              data.entries.filter(
                (e) =>
                  e.date === copyDate &&
                  (copyMeal === "All meals" || e.meal === copyMeal),
              ).length
            }{" "}
            entries will be added to {date}. Existing entries stay. Water is not
            copied.
          </p>
          <Button
            disabled={
              !data.entries.some(
                (e) =>
                  e.date === copyDate &&
                  (copyMeal === "All meals" || e.meal === copyMeal),
              )
            }
            onClick={async () => {
              if (
                await save((d) => ({
                  ...d,
                  entries: [
                    ...d.entries,
                    ...d.entries
                      .filter(
                        (e) =>
                          e.date === copyDate &&
                          (copyMeal === "All meals" || e.meal === copyMeal),
                      )
                      .map((e) => ({ ...structuredClone(e), id: uid(), date })),
                  ],
                }))
              ) {
                setCopy(false);
                notify("Copied into your diary.");
              }
            }}
          >
            Copy entries
          </Button>
        </Modal>
      )}
      {saveMeal && (
        <Modal title="Save this meal" close={() => setSaveMeal(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save((d) => ({
                  ...d,
                  savedMeals: [
                    ...d.savedMeals,
                    {
                      id: uid(),
                      name: mealName.trim(),
                      entries: structuredClone(
                        entries.filter((e) => e.meal === saveMeal),
                      ),
                    },
                  ],
                }))
              )
                setSaveMeal(null);
            }}
          >
            <Field label="Meal name">
              <input
                required
                maxLength={100}
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
            </Field>
            <Button disabled={!mealName.trim()} type="submit">
              Save meal
            </Button>
          </form>
        </Modal>
      )}
      {saved && (
        <Modal title="Your saved meals" close={() => setSaved(false)}>
          {data.savedMeals.length ? (
            <>
              <Field label="Choose a meal">
                <select
                  value={savedMealId}
                  onChange={(e) => setSavedMealId(e.target.value)}
                >
                  <option value="">Select a saved meal</option>
                  {data.savedMeals.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.entries.length} foods
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Log under">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value as Meal)}
                >
                  {meals.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <p>
                Log all saved portions on {date}. You can edit them afterwards.
              </p>
              <Button
                disabled={!savedMealId}
                onClick={async () => {
                  if (
                    await save((d) => ({
                      ...d,
                      entries: [
                        ...d.entries,
                        ...(
                          d.savedMeals.find((m) => m.id === savedMealId)
                            ?.entries ?? []
                        ).map((e) => ({
                          ...structuredClone(e),
                          id: uid(),
                          date,
                          meal: destination,
                        })),
                      ],
                    }))
                  )
                    setSaved(false);
                }}
              >
                Log saved meal
              </Button>
            </>
          ) : (
            <p className="empty">
              Log some food, then choose “Save meal” on a meal card.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
