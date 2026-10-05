"use client";
import { useState } from "react";
import { Target, Dumbbell, Scale } from "lucide-react";
import { estimate, today, uid } from "@/lib/nutrition/calculations";
import type { Profile } from "@/lib/nutrition/types";
import { useApp, Field, Button, Science, format } from "./common";
export default function Setup() {
  const { data, save, go } = useApp();
  const [p, setP] = useState<Profile>(
    data.profile ?? {
      age: 25,
      height: 170,
      weight: 70,
      sex: "unspecified",
      activity: 1.6,
      gymDays: 3,
      goal: "maintain",
      special: false,
      professional: null,
      vegetarian: false,
    },
  );
  const [error, setError] = useState("");
  const result = estimate(p);
  const set = (key: keyof Profile, v: unknown) => setP({ ...p, [key]: v });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (p.age < 18) {
      setError(
        "Forge is for adults. No profile or personalised targets are created for under-18s.",
      );
      return;
    }
    if (
      p.professional !== null &&
      (p.professional < 500 || p.professional > 10000)
    ) {
      setError("Check the professional target: enter 500–10,000 kcal.");
      return;
    }
    const t = result.targets;
    const ok = await save((d) => ({
      ...d,
      profile: p,
      targets: t,
      targetHistory: [
        ...d.targetHistory,
        {
          id: uid(),
          date: today(),
          createdAt: new Date().toISOString(),
          goal: p.goal,
          targets: t,
          profile: p,
        },
      ],
    }));
    if (ok) go("today");
  }
  return (
    <div className="setup">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR STARTING POINT</div>
          <h1>
            A plan that starts <em>with you.</em>
          </h1>
          <p>
            A few details help estimate your needs. You can change everything
            later.
          </p>
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="setup-grid">
          <section className="panel">
            <h2>First, the basics</h2>
            <p className="muted">
              Example values are shown. Replace them with your own.
            </p>
            <div className="form-grid">
              <Field label="Age (years)">
                <input
                  required
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={p.age}
                  onChange={(e) => set("age", Number(e.target.value))}
                />
              </Field>
              <Field label="Height (cm)">
                <input
                  required
                  type="number"
                  min="50"
                  max="260"
                  step="0.1"
                  value={p.height}
                  onChange={(e) => set("height", Number(e.target.value))}
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  required
                  type="number"
                  min="20"
                  max="500"
                  step="0.1"
                  value={p.weight}
                  onChange={(e) => set("weight", Number(e.target.value))}
                />
              </Field>
              <Field
                label="Equation sex parameter"
                hint="The original study used male/female coefficients to estimate resting energy; this is not a question about gender identity."
              >
                <select
                  value={p.sex}
                  onChange={(e) => set("sex", e.target.value)}
                >
                  <option value="unspecified">
                    Prefer no equation estimate
                  </option>
                  <option value="female">Female study parameter</option>
                  <option value="male">Male study parameter</option>
                </select>
              </Field>
            </div>
            <h3>Your whole week counts</h3>
            <Field label="Everyday activity, including training">
              <select
                value={p.activity}
                onChange={(e) => set("activity", Number(e.target.value))}
              >
                <option value={1.4}>
                  Mostly sitting, little walking or exercise · 1.4
                </option>
                <option value={1.6}>
                  Desk work, some walking and regular gym · 1.6
                </option>
                <option value={1.8}>
                  Active day, regular walking and training · 1.8
                </option>
                <option value={2.1}>
                  Physical work plus demanding training · 2.1
                </option>
              </select>
            </Field>
            <Field
              label="Usual gym sessions per week"
              hint="Recorded for context. Already included in your activity choice, never added twice."
            >
              <input
                type="number"
                min="0"
                max="7"
                step="1"
                required
                value={p.gymDays}
                onChange={(e) => set("gymDays", +e.target.value)}
              />
            </Field>
            <label className="check">
              <input
                type="checkbox"
                checked={p.vegetarian}
                onChange={(e) => set("vegetarian", e.target.checked)}
              />{" "}
              I eat vegetarian (dairy included; eggs excluded)
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={p.special}
                onChange={(e) => set("special", e.target.checked)}
              />{" "}
              Pregnant, breastfeeding, or a health condition / eating-disorder
              history affecting nutrition needs
            </label>
            <Field
              label="Existing professionally recommended target (optional, kcal/day)"
              hint="Enter a target you have already received, not an extreme target to pursue on your own."
            >
              <input
                type="number"
                min="500"
                max="10000"
                step="1"
                placeholder="e.g. 2200"
                value={p.professional ?? ""}
                onChange={(e) =>
                  set("professional", e.target.value ? +e.target.value : null)
                }
              />
            </Field>
          </section>
          <div>
            <section className="panel goal-panel">
              <h2>What are you working towards?</h2>
              <div className="goals">
                {(
                  [
                    [
                      "gain",
                      "Build muscle",
                      "A modest +5% starting surplus",
                      Dumbbell,
                    ],
                    [
                      "lose",
                      "Lose fat",
                      "A gentle −10% starting deficit",
                      Scale,
                    ],
                    [
                      "maintain",
                      "Find balance",
                      "Start around maintenance",
                      Target,
                    ],
                  ] as const
                ).map(([value, label, desc, Icon]) => (
                  <label
                    className={"goal " + (p.goal === value ? "selected" : "")}
                    key={value}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={value}
                      checked={p.goal === value}
                      onChange={() => set("goal", value)}
                    />
                    <Icon size={23} />
                    <span>
                      <strong>{label}</strong>
                      <small>{desc}</small>
                    </span>
                  </label>
                ))}
              </div>
              {result.issue && <p className="notice">{result.issue}</p>}
              <div className="estimate">
                <div>
                  <span>Estimated resting needs</span>
                  <b>
                    {format(result.resting)}{" "}
                    {result.resting !== null ? "kcal" : ""}
                  </b>
                </div>
                <div>
                  <span>Estimated maintenance</span>
                  <b>
                    {format(result.maintenance)}{" "}
                    {result.maintenance !== null ? "kcal" : ""}
                  </b>
                </div>
                <div className="target">
                  <span>
                    {p.professional
                      ? "Professional calorie target"
                      : "Suggested daily target"}
                  </span>
                  <b>
                    {format(
                      p.age < 18
                        ? null
                        : (p.professional ?? result.targets?.calories ?? null),
                    )}
                    <small> kcal</small>
                  </b>
                </div>
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit">
                {data.profile ? "Save setup changes" : "Create my journal"}
              </Button>
              <p className="small muted">
                Your profile saves on this device. Review sustained trends
                before adjusting your target.
              </p>
            </section>
          </div>
        </div>
      </form>
      <Science />
    </div>
  );
}
