"use client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Utensils,
  ChartNoAxesCombined,
  Settings,
  ShoppingBasket,
} from "lucide-react";
import { emptyData, type AppData } from "@/lib/nutrition/types";
import { today } from "@/lib/nutrition/calculations";
import { readData, updateData } from "@/lib/storage";
import { AppContext, Logo } from "./common";
import Landing from "./Landing";
import Setup from "./Setup";
import Dashboard from "./Dashboard";
import Library from "./Library";
import Progress from "./Progress";
import Preferences from "./Preferences";
import Planner from "./Planner";
const links = [
  ["today", "Overview", LayoutDashboard],
  ["diary", "Food diary", BookOpen],
  ["library", "My kitchen", Utensils],
  ["progress", "Progress", ChartNoAxesCombined],
  ["planner", "Food planning", ShoppingBasket],
  ["settings", "Settings", Settings],
] as const;
export default function App() {
  const [data, setData] = useState<AppData>(emptyData);
  const [route, setRoute] = useState("home");
  const [date, setDate] = useState(today);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, notify] = useState("");
  const [saving, setSaving] = useState(false);
  const go = (s: string) => {
    location.hash = s;
    setRoute(s);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    readData()
      .then((d) => {
        setData(d);
        setReady(true);
        const h = location.hash.slice(1);
        setRoute(h && h !== "philosophy" ? h : d.profile ? "today" : "home");
      })
      .catch(() => {
        setError(
          "Browser storage could not be opened. Check that storage is allowed, close other Forge tabs, then reload. Existing data has not been overwritten.",
        );
        setReady(true);
      });
    const hash = () => {
      const h = location.hash.slice(1);
      if (h !== "philosophy") setRoute(h || "home");
    };
    window.addEventListener("hashchange", hash);
    const refresh = () => {
      readData()
        .then(setData)
        .catch(() => {});
    };
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = data.reducedMotion
      ? "true"
      : "false";
  }, [data.reducedMotion]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => notify(""), 5000);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    if (!ready) return;
    if (
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const o = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            o.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => o.observe(el));
    return () => o.disconnect();
  }, [route, ready]);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (r) => {
          await navigator.serviceWorker.ready;
          const urls = performance
            .getEntriesByType("resource")
            .map((e) => e.name)
            .filter(
              (u) =>
                u.startsWith(location.origin) &&
                /\.(js|css|png|svg|woff2?)(\?|$)/.test(u),
            );
          r.active?.postMessage({
            type: "CACHE_ASSETS",
            urls: [location.origin + "/", ...urls],
          });
        })
        .catch(() => {});
    }
  }, []);
  async function save(fn: (d: AppData) => AppData) {
    setSaving(true);
    try {
      const d = await updateData(fn);
      setData(d);
      setError("");
      return true;
    } catch (e) {
      setError(
        "Could not save this change. " +
          (e instanceof Error ? e.message : "Check available browser storage."),
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  if (!ready)
    return (
      <div className="loading">
        <Logo />
        <p>Opening your journal…</p>
      </div>
    );
  const page = ["home", "philosophy"].includes(route) ? "home" : route;
  return (
    <AppContext.Provider value={{ data, save, notify, go, date, setDate }}>
      {typeof window !== "undefined" &&
        new URLSearchParams(location.search).get("qa") === "1" && (
          <div className="qa-banner">
            TEST JOURNAL · Sample verification data, separate from your personal
            journal.
          </div>
        )}
      {error && (
        <div className="storage-error" role="alert">
          {error} <button onClick={() => location.reload()}>Reload</button>
        </div>
      )}
      {page === "home" ? (
        <Landing />
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <a href="#home" aria-label="Forge home">
              <Logo />
            </a>
            <div className="sidebar-label">YOUR DAILY PRACTICE</div>
            <nav aria-label="Main navigation">
              {links.map(([key, label, Icon]) => (
                <a
                  aria-label={label}
                  aria-current={route === key ? "page" : undefined}
                  className={route === key ? "active" : ""}
                  href={"#" + key}
                  key={key}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <span className="local-icon">◈</span>
              <span>
                Just you. Your device.
                <br />
                <small>{saving ? "Saving…" : "Auto-saved locally"}</small>
              </span>
            </div>
          </aside>
          <main className="app-main">
            <header className="app-top">
              <a className="mobile-brand" href="#home" aria-label="Forge home">
                <Logo />
              </a>
              <span>THE EVERYDAY IS EVERYTHING.</span>
              <span>{saving ? "Saving…" : "Private by design"}</span>
            </header>
            {page === "setup" ? (
              <Setup />
            ) : !data.profile ? (
              <div className="panel empty">
                <h1>Your journal starts here.</h1>
                <p>
                  Set up a profile to track food with or without estimated
                  targets.
                </p>
                <button className="button" onClick={() => go("setup")}>
                  Set up my journal
                </button>
              </div>
            ) : page === "today" || page === "diary" ? (
              <Dashboard diaryOnly={page === "diary"} />
            ) : page === "library" ? (
              <Library />
            ) : page === "progress" ? (
              <Progress />
            ) : page === "planner" ? (
              <Planner />
            ) : page === "settings" ? (
              <Preferences />
            ) : (
              <div className="empty">
                <h1>Page not found</h1>
                <a href="#today">Back to your journal</a>
              </div>
            )}
          </main>
        </div>
      )}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </AppContext.Provider>
  );
}
