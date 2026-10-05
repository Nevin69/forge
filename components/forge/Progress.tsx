"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { today, dateShift, totals, uid } from "@/lib/nutrition/calculations";
import type { Weight } from "@/lib/nutrition/types";
import { useApp, Button, Modal, Field, format } from "./common";
function Chart({
  points,
  label,
  unit,
  color,
}: {
  points: { date: string; value: number | null }[];
  label: string;
  unit: string;
  color: string;
}) {
  const known = points.filter((p) => p.value !== null);
  if (!known.length)
    return (
      <div className="chart-empty">
        Your {label.toLowerCase()} history will appear here as you log it.
      </div>
    );
  const low = Math.min(...known.map((p) => p.value!)),
    high = Math.max(...known.map((p) => p.value!));
  const min = unit === "kg" ? Math.max(0, low - 0.5) : 0,
    max = high + (unit === "kg" ? 0.5 : Math.max(10, high * 0.1));
  const x = (i: number) => 45 + (i * 495) / (points.length - 1),
    y = (v: number) => 160 - ((v - min) / (max - min)) * 130;
  return (
    <>
      <svg
        className="history-chart"
        viewBox="0 0 560 195"
        role="img"
        aria-label={`${label} over ${points.length} days. Exact values available in the data table.`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="45"
              x2="540"
              y1={30 + 130 * t}
              y2={30 + 130 * t}
              stroke="#e9e2d8"
            />
            <text x="4" y={34 + 130 * t} fontSize="12" fill="#746b62">
              {format(max - (max - min) * t, unit === "kg" ? 1 : 0)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          p.value === null ? null : (
            <g key={p.date}>
              {i > 0 && points[i - 1].value !== null && (
                <line
                  x1={x(i - 1)}
                  y1={y(points[i - 1].value!)}
                  x2={x(i)}
                  y2={y(p.value)}
                  stroke={color}
                  strokeWidth="2.5"
                />
              )}
              <circle cx={x(i)} cy={y(p.value)} r="4" fill={color}>
                <title>
                  {p.date}: {p.value} {unit}
                </title>
              </circle>
            </g>
          ),
        )}
        <text x="45" y="188" fontSize="12" fill="#746b62">
          {points[0].date.slice(5)}
        </text>
        <text x="495" y="188" fontSize="12" fill="#746b62">
          {points.at(-1)?.date.slice(5)}
        </text>
      </svg>
      <details className="chart-data">
        <summary>View {label.toLowerCase()} data</summary>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>
                {label} ({unit})
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <td>{p.date}</td>
                <td>{format(p.value, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
export default function Progress() {
  const { data, save, notify } = useApp();
  const [days, setDays] = useState(7);
  const [end, setEnd] = useState(today());
  const [weight, setWeight] = useState<Weight | null>(null);
  const [remove, setRemove] = useState<Weight | null>(null);
  const dates = Array.from({ length: days }, (_, i) =>
    dateShift(end, i - days + 1),
  );
  const series = dates.map((date) => {
    const entries = data.entries.filter((e) => e.date === date);
    const t = totals(entries.map((e) => e.nutrients));
    return {
      date,
      weight: data.weights.find((w) => w.date === date)?.kg ?? null,
      calories: t.calories.partial ? null : t.calories.value,
      protein: t.protein.partial ? null : t.protein.value,
    };
  });
  const groups: Record<string, Weight[]> = {};
  data.weights
    .filter((w) => w.date <= end && w.date >= dateShift(end, -29))
    .forEach((w) => {
      const d = new Date(w.date + "T12:00:00"),
        monday = dateShift(w.date, -((d.getDay() + 6) % 7));
      (groups[monday] ??= []).push(w);
    });
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PROGRESS IS A PRACTICE</div>
          <h1>
            Look at the <em>long game.</em>
          </h1>
          <p>Trends tell a better story than a single number.</p>
        </div>
        <Button
          onClick={() =>
            setWeight({
              id: uid(),
              date: today(),
              kg: data.weights.at(-1)?.kg ?? data.profile?.weight ?? 70,
              note: "",
            })
          }
        >
          <Plus size={17} /> Log weight
        </Button>
      </div>
      <div className="date-toolbar">
        <div className="tabs compact">
          {[7, 30].map((n) => (
            <button
              className={days === n ? "active" : ""}
              key={n}
              onClick={() => setDays(n)}
            >
              {n} days
            </button>
          ))}
        </div>
        <Field label="Period ending">
          <input
            type="date"
            max={today()}
            value={end}
            onChange={(e) => e.target.value && setEnd(e.target.value)}
          />
        </Field>
      </div>
      <div className="progress-grid">
        {(
          [
            ["weight", "Body weight", "kg", "#722d3f"],
            ["calories", "Calorie intake", "kcal", "#ba7957"],
            ["protein", "Protein intake", "g", "#6b826a"],
          ] as const
        ).map(([key, label, unit, color]) => (
          <section className="panel chart-panel" key={key}>
            <h2>{label}</h2>
            <Chart
              points={series.map((p) => ({ date: p.date, value: p[key] }))}
              label={label}
              unit={unit}
              color={color}
            />
          </section>
        ))}
      </div>
      <p className="small muted">
        Unlogged days and incomplete nutrient totals are gaps, never zero-intake
        days. Lines connect only consecutive logged days.
      </p>
      <div className="two-col">
        <section className="panel">
          <h2>Weekly average weight</h2>
          <p className="small muted">
            Monday–Sunday averages using only your logged days within the last
            30 days of this view.
          </p>
          {Object.keys(groups).length ? (
            <table>
              <thead>
                <tr>
                  <th>Week starting</th>
                  <th>Average</th>
                  <th>Days logged</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groups)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([week, list]) => (
                    <tr key={week}>
                      <td>{week}</td>
                      <td>
                        {format(
                          list.reduce((s, w) => s + w.kg, 0) / list.length,
                          1,
                        )}{" "}
                        kg
                      </td>
                      <td>{list.length}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">
              Log weight to start seeing your weekly pattern.
            </p>
          )}
        </section>
        <section className="panel trend-note">
          <div className="eyebrow">A KINDER PERSPECTIVE</div>
          <h2>
            Consistency, <em>over intensity.</em>
          </h2>
          <p>
            Maintenance is an initial estimate. Review 2–4 weeks of consistent
            food logging and average body weight alongside training, recovery
            and hunger before considering a small target change.
          </p>
          <p>
            Day-to-day weight shifts often reflect water and digestion. No
            target changes happen automatically.
          </p>
          <p className="small">
            Facial definition cannot be targeted through this app. Nutrition
            cannot selectively remove facial fat or alter facial bone structure.
            Keep your focus on overall health and sustainable body trends.
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>Weight journal</h2>
        {data.weights.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...data.weights]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((w) => (
                    <tr key={w.id}>
                      <td>{w.date}</td>
                      <td>{format(w.kg, 1)} kg</td>
                      <td>{w.note || "—"}</td>
                      <td>
                        <button
                          aria-label={"Edit weight " + w.date}
                          className="icon-button"
                          onClick={() => setWeight({ ...w })}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={"Delete weight " + w.date}
                          onClick={() => setRemove(w)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            Your actual measurements will appear here. No example data is added.
          </p>
        )}
      </section>
      <section className="panel">
        <h2>Goal & target history</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Effective from</th>
                <th>Goal</th>
                <th>Calories</th>
                <th>Protein / carbs / fat</th>
              </tr>
            </thead>
            <tbody>
              {[...data.targetHistory].reverse().map((h) => (
                <tr key={h.id}>
                  <td>{h.date}</td>
                  <td>
                    {h.goal === "gain"
                      ? "Muscle gain"
                      : h.goal === "lose"
                        ? "Fat loss"
                        : "Maintenance"}
                  </td>
                  <td>
                    {h.targets
                      ? `${format(h.targets.calories)} kcal`
                      : "No generated target"}
                  </td>
                  <td>
                    {h.targets
                      ? `${format(h.targets.protein)} / ${format(h.targets.carbs)} / ${format(h.targets.fat)} g`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {weight && (
        <Modal title="Log your weight" close={() => setWeight(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save((d) => ({
                  ...d,
                  weights: [
                    ...d.weights.filter(
                      (w) => w.id !== weight.id && w.date !== weight.date,
                    ),
                    weight,
                  ].sort((a, b) => a.date.localeCompare(b.date)),
                }))
              ) {
                setWeight(null);
                notify("Weight saved.");
              }
            }}
          >
            <Field label="Date">
              <input
                type="date"
                required
                max={today()}
                value={weight.date}
                onChange={(e) => setWeight({ ...weight, date: e.target.value })}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                required
                min="20"
                max="500"
                step="0.1"
                value={weight.kg}
                onChange={(e) => setWeight({ ...weight, kg: +e.target.value })}
              />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                maxLength={1000}
                value={weight.note}
                onChange={(e) => setWeight({ ...weight, note: e.target.value })}
              />
            </Field>
            {data.weights.some(
              (w) => w.date === weight.date && w.id !== weight.id,
            ) && (
              <p className="notice">
                This replaces your existing measurement for {weight.date}.
              </p>
            )}
            <Button type="submit">Save weight</Button>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Delete measurement?" close={() => setRemove(null)}>
          <p>
            Remove {remove.kg} kg on {remove.date}?
          </p>
          <Button
            onClick={async () => {
              if (
                await save((d) => ({
                  ...d,
                  weights: d.weights.filter((w) => w.id !== remove.id),
                }))
              )
                setRemove(null);
            }}
          >
            Delete measurement
          </Button>
        </Modal>
      )}
    </>
  );
}
