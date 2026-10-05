"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { X, Flame, Info } from "lucide-react";
import type { AppData, Nutrient, Nutrients } from "@/lib/nutrition/types";
import { nutrientInfo, sources } from "@/lib/nutrition/references";
import { BRAND } from "@/lib/brand";
export type AppContextType = {
  data: AppData;
  save: (fn: (d: AppData) => AppData) => Promise<boolean>;
  notify: (s: string) => void;
  go: (s: string) => void;
  date: string;
  setDate: (s: string) => void;
};
export const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);
export function Logo() {
  return (
    <span className="logo">
      <Flame size={27} strokeWidth={1.5} />
      {BRAND.name}
      <span className="logo-dot">.</span>
    </span>
  );
}
export function Button({
  children,
  secondary = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button className={secondary ? "button secondary" : "button"} {...props}>
      {children}
    </button>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal wide" : "modal"}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          aria-label="Close dialog"
          className="icon-button"
          onClick={close}
        >
          <X />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export const format = (n: number | null, digits = 0) =>
  n === null
    ? "Unknown"
    : n.toLocaleString("en-IN", { maximumFractionDigits: digits });
export function NutrientPreview({ n }: { n: Nutrients }) {
  return (
    <div className="nutrition-preview">
      {(["calories", "protein", "carbs", "fat", "fibre"] as Nutrient[]).map(
        (k) => (
          <div key={k}>
            <strong>
              {format(n[k], k === "calories" ? 0 : 1)}
              <small> {n[k] === null ? "" : nutrientInfo[k].unit}</small>
            </strong>
            <span>{nutrientInfo[k].label}</span>
          </div>
        ),
      )}
    </div>
  );
}
export function Science() {
  return (
    <details className="science">
      <summary>
        <Info size={17} /> How we calculate this
      </summary>
      <div className="prose">
        <h3>Estimates, with room for real life.</h3>
        <p>
          Mifflin–St Jeor estimates resting energy: 10 × weight (kg) + 6.25 ×
          height (cm) − 5 × age (years), then +5 for the male study parameter or
          −161 for the female parameter. It was developed in 498 healthy adults
          aged 19–78. These parameters reflect the study groups, not gender
          identity; hormone therapy and individual body composition can affect
          accuracy.
        </p>
        <p>
          Estimated maintenance = resting energy × activity factor. We use 1.4,
          1.6, 1.8 or 2.1 as approximate starting points informed by FAO
          physical activity levels. FAO factors describe total expenditure
          relative to basal metabolism; applying them to estimated resting
          energy is a practical approximation. Include work, walking, household
          activity and gym sessions together. We never add exercise calories
          again.
        </p>
        <p>
          Muscle gain starts at +5% of maintenance. Fat loss starts at −10%, a
          conservative app choice informed by research supporting gradual weight
          change, not a clinically validated prescription. Maintenance uses no
          adjustment. Review several weeks of intake, average weight, recovery
          and training before changing a target. The app never adjusts targets
          automatically.
        </p>
        <p>
          Protein starts at 1.6 g/kg/day, supported by resistance-training
          research in healthy adults eating at or above their needs. Needs
          during a deficit can differ. Fat receives 30% of energy (within the
          adult 20–35% reference range); carbohydrates receive the remainder.
          Macro energy uses 4 kcal/g protein, 4 kcal/g carbohydrate and 9 kcal/g
          fat. Food-label calories can differ because of fibre, rounding and
          food-specific factors.
        </p>
        <p>
          As an app guardrail, automatic suggestions below 1,200 kcal for the
          female parameter or 1,500 kcal for the male parameter are withheld;
          these are not universal safe minimums. No generated targets for people
          under 19, over 78, BMI below 18.5, pregnancy, breastfeeding or
          conditions needing individual nutrition care. Adults can use the diary
          alone or record professional targets. This is an educational tracker,
          not a diagnosis or treatment plan.
        </p>
        <p>
          Micronutrients use US/Canadian National Academies values reported by
          NIH, adjusted for age and the selected sex parameter. RDA covers most
          healthy people; AI is an estimate where evidence is insufficient for
          an RDA. Sodium uses the 2,300 mg chronic disease risk reduction
          threshold (CDRR), not a minimum to reach. These are references, not
          personalised prescriptions or maximums. More is not always better.
          Vegetarian iron uses NIH’s 1.8× adjustment; smokers need 35 mg/day
          more vitamin C than the displayed baseline.
        </p>
        <p>
          USDA records describe specific foods and preparations, which may
          differ from Indian varieties. Weigh edible portions. Household
          measures come from the source record; a household bowl has no
          universal weight. Recipes sum ingredient data and divide by final
          yield, without estimating cooking losses. Unknown nutrient values stay
          unknown; a partial total cannot diagnose a deficiency. Water’s initial
          2,500 ml goal is an editable logging preference, not a personalised
          hydration recommendation; food water is not counted.
        </p>
        <ul>
          {sources.map(([title, url]) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer">
                {title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
