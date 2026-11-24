
import type { GameState } from "../types";

import type {
  GameAction,
} from "../engine/actions";

import {
  getCurrentPlayer,
} from "../engine/state";

import {
  canPickUpTreasure,
  canDropTreasure,
} from "../engine/treasure";

interface Props {
  state: GameState;
  isBot: boolean;
  onAction: (action: GameAction) => void;
}

export default function ActionPanel({
  state,
  isBot,
  onAction,
}: Props) {
  if (state.phase !== "playing") {
    return null;
  }

  const player = getCurrentPlayer(state);

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

      <p>Stage: {state.turnStage}</p>

      {state.turnStage === "breathe" && (
        <button
          onClick={() =>
            onAction({ type: "START_TURN" })
          }
        >
          Start turn
        </button>
      )}

      {state.turnStage === "declare" && (
        <div className="dsa-actions">
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

          <button
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
        </div>
      )}

      {state.turnStage === "swim" && (
        <button
          onClick={() =>
            onAction({ type: "ROLL_DICE" })
          }
        >
          Roll dice
        </button>
      )}

      {state.diceResult && (
        <p>
          Dice: {state.diceResult.first}
          {" + "}
          {state.diceResult.second}
          {" = "}
          {state.diceResult.total}
        </p>
      )}

      {state.turnStage === "treasure" && (
        <div className="dsa-actions">
          <button
            disabled={
              !canPickUpTreasure(state, player)
            }
            onClick={() =>
              onAction({
                type: "PICK_UP_TREASURE",
              })
            }
          >
            Pick up
          </button>

          {canDropTreasure(state, player) &&
            player.cargo.map((bundle, index) => (
              <button
                key={bundle.id}
                onClick={() =>
                  onAction({
                    type: "DROP_TREASURE",
                    bundleId: bundle.id,
                  })
                }
              >
                Drop #{index + 1} (
                {bundle.treasures
                  .map((treasure) =>
                    `L${treasure.level}`,
                  )
                  .join(", ")}
                )
              </button>
            ))}

          <button
            onClick={() =>
              onAction({
                type: "SKIP_TREASURE",
              })
            }
          >
            Skip
          </button>
        </div>
      )}
    </section>
  );
}
