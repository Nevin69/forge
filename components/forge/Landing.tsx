"use client";
import { assetUrl } from "@/lib/deployment";
import { useEffect, useRef } from "react";
import {
  Flame,
  ShieldCheck,
  Sprout,
  ChartNoAxesCombined,
  ChevronDown,
} from "lucide-react";
import { Logo, Button, useApp } from "./common";
export default function Landing() {
  const { data, go } = useApp();
  const hero = useRef<HTMLElement>(null);
  useEffect(() => {
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !matchMedia("(pointer:fine)").matches
    )
      return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hero.current?.style.setProperty(
          "--mx",
          `${(e.clientX / innerWidth - 0.5) * 12}px`,
        );
        hero.current?.style.setProperty(
          "--my",
          `${(e.clientY / innerHeight - 0.5) * 10}px`,
        );
      });
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="landing">
      <section className="hero" ref={hero}>
        <header className="landing-nav">
          <a href="#home" aria-label="Forge home">
            <Logo />
          </a>
          <nav>
            <a href="#philosophy">The approach</a>
            <button onClick={() => go(data.profile ? "today" : "setup")}>
              {data.profile ? "Your dashboard" : "Open tracker"}
            </button>
          </nav>
        </header>
        <div className="hero-object object-left" aria-hidden="true">
          <img
            src={assetUrl("dumbbell-hero.png")}
            alt=""
            width="1254"
            height="1254"
          />
        </div>
        <div className="hero-object object-right" aria-hidden="true">
          <img
            src={assetUrl("dumbbell-hero.png")}
            alt=""
            width="1254"
            height="1254"
          />
        </div>
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> A LITTLE INTENTION. EVERY DAY.
          </div>
          <h1>
            Build your strength.
            <br />
            <em>Find your balance.</em>
          </h1>
          <p>
            Good food. Honest numbers. A stronger you.
            <br />
            Your everyday nutrition companion, rooted in real life.
          </p>
          <Button onClick={() => go(data.profile ? "today" : "setup")}>
            {data.profile ? "Back to your dashboard" : "Start tracking"}
          </Button>
          <div className="hero-note">
            Always free <span>·</span> No account needed <span>·</span> Yours to
            keep
          </div>
        </div>
        <div className="hero-bottom">
          <span>NOURISH THE WORK YOU PUT IN.</span>
          <a href="#philosophy" aria-label="Discover the approach">
            <ChevronDown size={21} />
          </a>
          <span>NUTRITION, WITHOUT THE NOISE.</span>
        </div>
      </section>
      <section className="philosophy" id="philosophy">
        <div className="eyebrow">THE LONG GAME</div>
        <h2>
          Small choices.
          <br />
          <em>Stronger foundations.</em>
        </h2>
        <div className="feature-grid">
          {[
            [
              Sprout,
              "Your food belongs here.",
              "From rice and dal to your homemade favourites. Weigh it, log it, make it your own.",
            ],
            [
              ChartNoAxesCombined,
              "See the bigger picture.",
              "Understand your intake and watch your trends. Progress has more than one number.",
            ],
            [
              ShieldCheck,
              "Your health. Your business.",
              "No accounts, subscriptions or analytics. Your journal stays in this browser.",
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof Flame;
            return (
              <article className="reveal" key={title as string}>
                <I size={27} strokeWidth={1.3} />
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </article>
            );
          })}
        </div>
        <Button onClick={() => go(data.profile ? "today" : "setup")}>
          Make a start
        </Button>
      </section>
      <footer>
        <Logo />
        <span>Built by you. Fuelled by food.</span>
        <span>LOCAL BY DESIGN.</span>
      </footer>
    </div>
  );
}
