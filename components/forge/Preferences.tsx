"use client";
import { useState } from "react";
import { Download, Upload, ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  emptyData,
  nutrientKeys,
  type AppData,
  type Targets,
} from "@/lib/nutrition/types";
import {
  csv,
  estimate,
  targetWarnings,
  today,
  uid,
} from "@/lib/nutrition/calculations";
import { download, validateImport } from "@/lib/storage";
import { useApp, Button, Modal, Field, Science, format } from "./common";
export default function Preferences() {
  const { data, save, go, notify } = useApp();
  const [t, setT] = useState<Targets>(
    data.targets ?? {
      calories: data.profile?.professional ?? 2000,
      protein: 0,
      carbs: 0,
      fat: 0,
      fibre: 0,
      water: data.waterGoal,
    },
  );
  const [water, setWater] = useState(data.waterGoal);
  const [incoming, setIncoming] = useState<AppData | null>(null);
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const warnings = targetWarnings(t, data.profile);
  const e = data.profile ? estimate(data.profile) : null;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KEEP IT PERSONAL</div>
          <h1>
            On <em>your terms.</em>
          </h1>
          <p>Your targets, your data, your device.</p>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <h2>
            <SlidersHorizontal size={21} /> Your profile
          </h2>
          <p>
            {data.profile?.age} years · {data.profile?.height} cm ·{" "}
            {data.profile?.weight} kg at setup
          </p>
          <p className="muted">
            Resting estimate: {format(e?.resting ?? null)} kcal
            <br />
            Maintenance estimate: {format(e?.maintenance ?? null)} kcal
          </p>
          <Button secondary onClick={() => go("setup")}>
            Edit profile & goal
          </Button>
          <p className="small muted">
            Changing setup recalculates the suggested targets. Weight logging
            alone does not change your profile or targets.
          </p>
        </section>
        <section className="panel">
          <h2>
            <ShieldCheck size={21} /> A journal that stays yours
          </h2>
          <p>
            Everything you enter is stored in this browser using IndexedDB. No
            health data is sent to analytics or nutrition services. No account
            or subscription is required by the app.
          </p>
          <p className="small muted">
            Clearing site data, using private browsing, changing browser or
            changing the website address can remove or separate your journal.
            Export regular backups. A private hosted preview may ask you to sign
            in to the hosting platform; running locally needs no account.
          </p>
          <button
            className="text-button"
            onClick={async () => {
              const granted = await navigator.storage?.persist?.();
              notify(
                granted
                  ? "Persistent browser storage granted. Keep backups too."
                  : "The browser did not grant persistent storage. Your journal still auto-saves; keep regular backups.",
              );
            }}
          >
            Request persistent storage
          </button>
        </section>
      </div>
      <section className="panel">
        <h2>Daily targets</h2>
        <p className="muted">
          Manual edits take effect from today. Earlier target records stay in
          your history. Use your clinician’s or dietitian’s values if you have
          them.
        </p>
        {!data.targets && (
          <p className="notice">
            No personalised macro target is available. The calorie field starts
            with your professional target or a generic editing value; enter all
            your own targets before saving.
          </p>
        )}
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (!data.profile || data.profile.age < 18) return;
            setBusy(true);
            if (
              await save((d) => ({
                ...d,
                targets: t,
                waterGoal: t.water,
                targetHistory: [
                  ...d.targetHistory,
                  {
                    id: uid(),
                    date: today(),
                    createdAt: new Date().toISOString(),
                    goal: d.profile!.goal,
                    targets: t,
                    profile: d.profile!,
                  },
                ],
              }))
            )
              notify("Targets saved from today.");
            setBusy(false);
          }}
        >
          <div className="target-fields">
            {(
              ["calories", "protein", "carbs", "fat", "fibre", "water"] as const
            ).map((k) => (
              <Field
                label={
                  k === "calories"
                    ? "Calories (kcal)"
                    : k === "water"
                      ? "Water (ml)"
                      : `${k === "carbs" ? "Carbohydrate" : k[0].toUpperCase() + k.slice(1)} (g)`
                }
                key={k}
              >
                <input
                  required
                  type="number"
                  min={k === "calories" ? 500 : k === "water" ? 100 : 0}
                  max={k === "calories" || k === "water" ? 10000 : 2000}
                  step="any"
                  value={t[k]}
                  onChange={(e) => setT({ ...t, [k]: +e.target.value })}
                />
              </Field>
            ))}
          </div>
          <p className="small">
            Macro energy:{" "}
            <b>{format(t.protein * 4 + t.carbs * 4 + t.fat * 9)} kcal</b> (4 ×
            protein + 4 × carbs + 9 × fat)
          </p>
          {warnings.map((w) => (
            <p className="notice" key={w}>
              {w}
            </p>
          ))}
          <Button disabled={busy} type="submit">
            Save daily targets
          </Button>
        </form>
      </section>
      <section className="panel">
        <h2>Comfort & accessibility</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={data.reducedMotion}
            onChange={(e) => {
              const checked = e.target.checked;
              save((d) => ({ ...d, reducedMotion: checked }));
            }}
          />{" "}
          Reduce decorative motion
        </label>
        <p className="small muted">
          Your device’s reduced-motion preference is always respected. This
          switch also stops decorative animation and transitions.
        </p>
        <h3>Water goal</h3>
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await save((d) => ({ ...d, waterGoal: water })))
              notify("Water goal updated.");
          }}
        >
          <Field label="Daily water logging goal (ml)">
            <input
              type="number"
              required
              min="100"
              max="10000"
              step="50"
              value={water}
              onChange={(e) => setWater(+e.target.value)}
            />
          </Field>
          <Button secondary type="submit">
            Update water goal
          </Button>
        </form>
        <p className="small muted">
          A tracking preference, not a medical fluid prescription. Needs vary
          with heat, exercise and health; this does not count water in food.
        </p>
      </section>
      <section className="panel">
        <h2>Back up. Take it with you.</h2>
        <p className="muted">
          JSON keeps all your information and can restore it here. CSV files are
          useful in a spreadsheet.
        </p>
        <div className="actions export-actions">
          <Button
            secondary
            onClick={() =>
              download(
                `forge-backup-${today()}.json`,
                JSON.stringify(data, null, 2),
              )
            }
          >
            <Download size={17} /> Export all data (JSON)
          </Button>
          <Button
            secondary
            onClick={() =>
              download(
                `forge-diary-${today()}.csv`,
                csv([
                  ["date", "meal", "food", "grams", "source", ...nutrientKeys],
                  ...data.entries.map((e) => [
                    e.date,
                    e.meal,
                    e.name,
                    e.grams,
                    e.source,
                    ...nutrientKeys.map((k) => e.nutrients[k]),
                  ]),
                ]),
                "text/csv;charset=utf-8",
              )
            }
          >
            Diary CSV
          </Button>
          <Button
            secondary
            onClick={() =>
              download(
                `forge-weight-${today()}.csv`,
                csv([
                  ["date", "weight_kg", "note"],
                  ...data.weights.map((w) => [w.date, w.kg, w.note]),
                ]),
                "text/csv;charset=utf-8",
              )
            }
          >
            Weight CSV
          </Button>
        </div>
        <p className="small muted">
          Blank nutrient cells in CSV mean unknown, not zero. Units: kcal, g for
          macros/fibre, mg for minerals and C, µg RAE for A, µg for D/B12, µg
          DFE for folate.
        </p>
        <Field
          label="Import a Forge JSON backup"
          hint="Validation and a summary appear before any data is replaced."
        >
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              setError("");
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 20_000_000)
                  throw Error("File must be smaller than 20 MB.");
                setIncoming(validateImport(JSON.parse(await file.text())));
              } catch (err) {
                setIncoming(null);
                setError(
                  "Import rejected. " +
                    (err instanceof Error
                      ? err.message.slice(0, 500)
                      : "Invalid JSON."),
                );
              }
              e.target.value = "";
            }}
          />
        </Field>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </section>
      <section className="panel danger-panel">
        <h2>Reset this browser’s journal</h2>
        <p>
          This permanently removes your profile, entries, foods, recipes,
          weights and preferences from this browser.
        </p>
        <Button
          secondary
          onClick={() => {
            setReset(true);
            setConfirm("");
          }}
        >
          Reset all data
        </Button>
      </section>
      <Science />
      {incoming && (
        <Modal title="Review your backup" close={() => setIncoming(null)}>
          <div className="import-preview">
            <p>
              <b>{incoming.entries.length}</b> diary entries
            </p>
            <p>
              <b>{incoming.recipes.length}</b> recipes ·{" "}
              <b>{incoming.foods.length}</b> custom foods
            </p>
            <p>
              <b>{incoming.weights.length}</b> weights ·{" "}
              <b>{incoming.targetHistory.length}</b> target records
            </p>
            <p>
              <b>{incoming.savedMeals.length}</b> saved meals ·{" "}
              <b>{incoming.shopping.length}</b> shopping items
            </p>
            <p>
              Profile: {incoming.profile ? "Included" : "None"} · schema version{" "}
              {incoming.version}
            </p>
          </div>
          <p className="notice">
            Import replaces all current app data. Export your current journal
            first if you want to keep it. It does not merge records.
          </p>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              if (await save(() => incoming)) {
                setIncoming(null);
                notify("Backup restored.");
                go("today");
              }
              setBusy(false);
            }}
          >
            <Upload size={17} /> Replace with this backup
          </Button>
        </Modal>
      )}
      {reset && (
        <Modal title="Reset everything?" close={() => setReset(false)}>
          <p>
            Export a backup first. This action cannot be undone without a
            backup.
          </p>
          <Field label="Type RESET to confirm">
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Button
            disabled={confirm !== "RESET" || busy}
            onClick={async () => {
              setBusy(true);
              if (await save(() => emptyData())) {
                setReset(false);
                go("home");
                notify("Journal reset.");
              }
              setBusy(false);
            }}
          >
            Permanently reset
          </Button>
        </Modal>
      )}
    </>
  );
}
