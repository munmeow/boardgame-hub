import { useEffect, useRef, useState } from "react";
import { DICE_ROLL_CONFIG } from "../constants/ui";

import type { GameState } from "@boardgame-hub/abyss-relay/types";

import type {
  GameAction,
} from "@boardgame-hub/abyss-relay/engine/actions";

import {
  getCurrentPlayer,
} from "@boardgame-hub/abyss-relay/engine/state";

import {
  canPickUpTreasure,
  canDropTreasure,
} from "@boardgame-hub/abyss-relay/engine/treasure";

interface Props {
  state: GameState;
  isBot: boolean;
  isRolling: boolean;
  onAction: (action: GameAction, rollDuration?: number) => void;
}

function HoldToRoll({ onRoll }: { onRoll: (duration: number) => void }) {
  const start = useRef<number | null>(null);
  const frame = useRef(0);
  const [power, setPower] = useState(0);
  const [holding, setHolding] = useState(false);
  const { MAX_HOLD_DURATION, MIN_ROLL_DURATION, MAX_ROLL_DURATION } = DICE_ROLL_CONFIG;
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function begin() {
    if (start.current !== null) return;
    start.current = performance.now();
    setHolding(true);
    const tick = () => {
      if (start.current === null) return;
      const charge = Math.min(1, (performance.now() - start.current) / MAX_HOLD_DURATION);
      setPower(charge);
      if (charge < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }
  function cancel() {
    start.current = null;
    cancelAnimationFrame(frame.current);
    setHolding(false);
    setPower(0);
  }
  function release() {
    if (start.current === null) return;
    const charge = Math.min(1, (performance.now() - start.current) / MAX_HOLD_DURATION);
    cancel();
    onRoll(Math.round(MIN_ROLL_DURATION + charge * (MAX_ROLL_DURATION - MIN_ROLL_DURATION)));
  }
  return <div className="dsa-hold-roll">
    <div className="dsa-roll-power-label"><span>Roll power</span><span>{Math.round(power * 100)}%</span></div>
    <div className="dsa-roll-power" role="progressbar" aria-label="Roll power" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(power * 100)}><span style={{transform: `scaleX(${power})`}} /></div>
    <button type="button" className={`dsa-hold-button ${holding ? "dsa-hold-button--charging" : ""}`}
      onPointerDown={e => { if (!e.isPrimary || e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); begin(); }}
      onPointerUp={e => { if (e.isPrimary && e.button === 0) release(); }}
      onPointerCancel={cancel} onLostPointerCapture={cancel} onBlur={cancel}
      onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) begin(); } }}
      onKeyUp={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); release(); } }}
      onClick={e => { if (e.detail === 0 && start.current === null) onRoll(MIN_ROLL_DURATION); }}>
      {holding ? "Release to Roll" : "Hold to Roll"}
    </button>
  </div>;
}

export default function ActionPanel({
  state,
  isBot,
  isRolling,
  onAction,
}: Props) {
  if (state.phase !== "playing") {
    return null;
  }

  if (isRolling) {
    return (
      <div className="dsa-action-panel">
        <button
          className="dsa-button"
          disabled
        >
          Rolling dice...
        </button>
      </div>
    );
  }

  const player = getCurrentPlayer(state);

  const TREASURE_SHAPES: Record<number, string> = {
    1: "40,5 75,68 5,68",
    2: "10,10 70,10 70,70 10,70",
    3: "40,3 77,30 63,75 17,75 3,30",
    4: "20,5 60,5 78,40 60,75 20,75 2,40",
  };

  const TREASURE_COLORS: Record<number, string> = {
    1: "#d6b78a",
    2: "#94a3b8",
    3: "#60a5fa",
    4: "#a78bfa",
  };

  function TreasureIcon({ level }: { level: number }) {
    return (
      <svg
        className="dsa-drop-treasure-icon"
        viewBox="0 0 80 80"
        role="img"
        aria-label={`Tier ${level} treasure`}
      >
        <polygon
          points={TREASURE_SHAPES[level]}
          fill={TREASURE_COLORS[level]}
          stroke="#422006"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <polygon
          points={TREASURE_SHAPES[level]}
          fill="none"
          stroke="#00000035"
          strokeWidth="2"
          transform="translate(8 8) scale(.8)"
        />
      </svg>
    );
  }

  const canChooseDirection =
    player.diver.position > 0 &&
    !player.diver.hasTurned &&
    player.diver.direction === "outward";

  if (isBot) {
    return (
      <section className="dsa-panel">
        {player.name} is thinking...
      </section>
    );
  }

  return (
    <section className="dsa-panel">
      <h2>{player.name}'s turn</h2>

      {state.turnStage === "breathe" && (
        <button
          onClick={() =>
            onAction({ type: "START_TURN" })
          }
        >
          Start turn
        </button>
      )}

      {state.turnStage === "declare" &&
        canChooseDirection && (
          <div className="dsa-actions">
            <button
              className="dsa-button-turn-back"
              disabled={
                player.diver.hasTurned ||
                player.diver.position === 0
              }
              onClick={() =>
                onAction({
                  type: "DECLARE_DIRECTION",
                  turnBack: true,
                })
              }
            >
              Turn back
            </button>

            <button
              onClick={() =>
                onAction({
                  type: "DECLARE_DIRECTION",
                  turnBack: false,
                })
              }
            >
              Continue
            </button>
          </div>
        )}

      {(state.turnStage === "swim" ||
        (state.turnStage === "declare" &&
          !canChooseDirection)) && (
          <HoldToRoll onRoll={(duration) => onAction({ type: "ROLL_DICE" }, duration)} />
        )}


      {state.turnStage === "treasure" && (
        <div className="dsa-actions dsa-treasure-actions">

          {/* PICK UP */}
          <button
            className="dsa-button-pick-up"
            disabled={!canPickUpTreasure(state, player)}
            onClick={() =>
              onAction({
                type: "PICK_UP_TREASURE",
              })
            }
          >
            Pick up
          </button>

          {/* SKIP */}
          <button
            className="dsa-button-skip"
            onClick={() =>
              onAction({
                type: "SKIP_TREASURE",
              })
            }
          >
            Skip
          </button>

          {/* DROP TREASURES */}
          {canDropTreasure(state, player) &&
            player.cargo.map((bundle, index) => (
              <button
                key={bundle.id}
                className="dsa-button-drop"
                onClick={() =>
                  onAction({
                    type: "DROP_TREASURE",
                    bundleId: bundle.id,
                  })
                }
              >
                <span className="dsa-drop-label">
                  Drop #{index + 1}
                </span>

                <span className="dsa-drop-treasure-icons">
                  {bundle.treasures.map((treasure) => (
                    <TreasureIcon
                      key={treasure.id}
                      level={treasure.level}
                    />
                  ))}
                </span>
              </button>
            ))}

        </div>
      )}
    </section>
  );
}
