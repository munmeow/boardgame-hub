
import {
  useEffect,
  useState,
} from "react";

import type { CSSProperties } from "react";

import type { DiceResult } from "../types";

import "../styles/dice.css";

interface Props {
  rolling: boolean;
  result: DiceResult | null;
  cargoCount: number;
  moving?: boolean;
  turning?: boolean;
  rollDuration?: number;
}

const DOT_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
};

function randomFace(): number {
  return Math.floor(Math.random() * 3) + 1;
}

function DiceFace({
  value,
  rolling,
}: {
  value: number;
  rolling: boolean;
}) {
  return (
    <div
      className={[
        "dsa-dice-face",
        rolling ? "dsa-dice-rolling" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Dice: ${value}`}
    >
      {Array.from(
        { length: 9 },
        (_, index) => (
          <span
            key={index}
            className={
              DOT_POSITIONS[value]?.includes(index)
                ? "dsa-dice-dot"
                : "dsa-dice-empty"
            }
          />
        ),
      )}
    </div>
  );
}

export default function DiceRoller({
  rolling,
  result,
  cargoCount,
  moving = false,
  turning = false,
  rollDuration = 900,
}: Props) {
  const [preview, setPreview] = useState([
    1, 1,
  ]);

  useEffect(() => {
    if (!rolling) return;

    const start = performance.now();
    let timer: number;
    const tick = () => {
      const progress = Math.min(1, (performance.now() - start) / rollDuration);
      setPreview([randomFace(), randomFace()]);
      if (progress < 1) timer = window.setTimeout(tick, 55 + progress * progress * 145);
    };
    timer = window.setTimeout(tick, 55);
    return () => window.clearTimeout(timer);
  }, [rolling, rollDuration]);

  const first = rolling
    ? preview[0]
    : result?.first ?? 1;

  const second = rolling
    ? preview[1]
    : result?.second ?? 1;

  const total = result?.total ?? 0;

  const movement = Math.max(
    0,
    total - cargoCount,
  );

  const heading = turning
    ? "Turning back..."
    : rolling
      ? "Rolling dice..."
      : moving
        ? "Diver is moving..."
        : result
          ? "Dice result"
          : "Ready to roll";

  return (
    <section className="dsa-dice-container" style={rolling ? {
      "--roll-duration": `${rollDuration}ms`,
      "--roll-angle": `${Math.round(1 + rollDuration / 600) * 360}deg`,
    } as CSSProperties : undefined}>
      <div className="dsa-dice-heading">
        {heading}
      </div>

      <div className="dsa-dice-pair">
        <DiceFace
          value={first}
          rolling={rolling}
        />

        <DiceFace
          value={second}
          rolling={rolling}
        />
      </div>

      <div
        className="dsa-dice-stats"
        aria-live="polite"
      >
        <div className="dsa-dice-stat">
          <span>Dice total</span>

          <strong>
            {rolling || !result
              ? "–"
              : total}
          </strong>
        </div>

        <div className="dsa-dice-stat">
          <span>Cargo penalty</span>

          <strong className="dsa-dice-penalty">
            -{cargoCount}
          </strong>
        </div>

        <div className="dsa-dice-stat">
          <span>Movement</span>

          <strong className="dsa-dice-movement">
            {rolling || !result
              ? "–"
              : movement}
          </strong>
        </div>
      </div>

      {(rolling || moving || turning) && (
        <div className="dsa-dice-progress" style={rolling ? { "--roll-duration": `${rollDuration}ms` } as CSSProperties : undefined}>
          <div className={rolling ? "dsa-roll-progress" : undefined} />
        </div>
      )}
    </section>
  );
}
