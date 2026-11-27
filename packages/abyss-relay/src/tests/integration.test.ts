
import { describe, it, expect } from "vitest";

import { setupGame } from "../engine/setup.js";
import { applyAction } from "../engine/actions.js";
import { chooseBotAction } from "../bot/bot.js";

import type { GameState } from "../types/index.js";

function getAllTreasureIds(
  state: GameState,
): string[] {
  return [
    ...state.track.flatMap(
      (tile) =>
        tile.bundle?.treasures.map(
          (treasure) => treasure.id,
        ) ?? [],
    ),

    ...state.players.flatMap(
      (player) =>
        player.cargo.flatMap(
          (bundle) =>
            bundle.treasures.map(
              (treasure) => treasure.id,
            ),
        ),
    ),

    ...state.players.flatMap(
      (player) =>
        player.collected.map(
          (treasure) => treasure.id,
        ),
    ),
  ];
}

describe("Deep Sea Adventure - Integration", () => {
  it("preserves all 32 unique treasures", () => {
    const state = setupGame(["A", "B", "C"]);

    const ids = getAllTreasureIds(state);

    expect(ids).toHaveLength(32);
    expect(new Set(ids).size).toBe(32);
  });

  it("completes a full three-round bot game", () => {
    let state = setupGame([
      "Bot 1",
      "Bot 2",
      "Bot 3",
    ]);

    const initialIds = new Set(
      getAllTreasureIds(state),
    );

    let actionCount = 0;

    const maxActions = 5000;

    while (
      state.phase !== "finished" &&
      actionCount < maxActions
    ) {
      const action = chooseBotAction(
        state,
        "normal",
      );

      if (!action) {
        throw new Error("Bot produced no action.");
      }

      state = applyAction(state, action);

      const ids = getAllTreasureIds(state);

      expect(ids).toHaveLength(32);
      expect(new Set(ids)).toEqual(initialIds);

      actionCount++;
    }

    expect(actionCount).toBeLessThan(maxActions);
    expect(state.phase).toBe("finished");
    expect(state.round).toBe(3);
  });
});
