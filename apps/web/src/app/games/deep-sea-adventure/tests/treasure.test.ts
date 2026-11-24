
import { describe, it, expect } from "vitest";
import { setupGame } from "../engine/setup";
import {
  canPickUpTreasure,
  canDropTreasure,
  pickUpTreasure,
  dropTreasure,
} from "../engine/treasure";

describe("Deep Sea Adventure - Treasure", () => {
  it("allows picking up treasure on a treasure tile", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    expect(
      canPickUpTreasure(state, state.players[0]),
    ).toBe(true);
  });

  it("adds the treasure bundle to player cargo", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    const originalBundle = state.track[0].bundle;

    const updatedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    expect(updatedState.players[0].cargo).toHaveLength(1);

    expect(updatedState.players[0].cargo[0]).toEqual(
      originalBundle,
    );
  });

  it("replaces the treasure tile with a blank tile", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    const updatedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    expect(updatedState.track[0].type).toBe("blank");
    expect(updatedState.track[0].bundle).toBeNull();
    expect(updatedState.track).toHaveLength(32);
  });

  it("does not mutate the original game state", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    pickUpTreasure(state, state.players[0].id);

    expect(state.players[0].cargo).toHaveLength(0);
    expect(state.track[0].type).toBe("treasure");
    expect(state.track[0].bundle).not.toBeNull();
  });

  it("does not allow picking up treasure from a blank tile", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    const updatedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    expect(
      canPickUpTreasure(
        updatedState,
        updatedState.players[0],
      ),
    ).toBe(false);

    expect(() =>
      pickUpTreasure(
        updatedState,
        updatedState.players[0].id,
      ),
    ).toThrow();
  });

  it("does not allow picking up treasure at the submarine", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    expect(
      canPickUpTreasure(state, state.players[0]),
    ).toBe(false);
  });

  it("does not allow dropping treasure with empty cargo", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    state.track[0] = {
      ...state.track[0],
      type: "blank",
      bundle: null,
    };

    expect(
      canDropTreasure(state, state.players[0]),
    ).toBe(false);
  });

  it("allows dropping treasure on a blank tile", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    const pickedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    expect(
      canDropTreasure(
        pickedState,
        pickedState.players[0],
      ),
    ).toBe(true);
  });

  it("removes the dropped bundle from cargo", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    const pickedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    const bundleId =
      pickedState.players[0].cargo[0].id;

    const droppedState = dropTreasure(
      pickedState,
      pickedState.players[0].id,
      bundleId,
    );

    expect(droppedState.players[0].cargo).toHaveLength(0);
    expect(droppedState.track[0].type).toBe("treasure");
    expect(droppedState.track[0].bundle?.id).toBe(bundleId);
  });

  it("does not allow dropping onto a treasure tile", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    const pickedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    pickedState.players[0].diver.position = 2;

    expect(
      canDropTreasure(
        pickedState,
        pickedState.players[0],
      ),
    ).toBe(false);
  });

  it("picks up an entire treasure stack as one bundle", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    state.track[0].bundle = {
      id: "stack-1",
      treasures: [
        { id: "t1", level: 1, value: 1 },
        { id: "t2", level: 2, value: 5 },
        { id: "t3", level: 3, value: 9 },
      ],
    };

    const updatedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    expect(updatedState.players[0].cargo).toHaveLength(1);

    expect(
      updatedState.players[0].cargo[0].treasures,
    ).toHaveLength(3);
  });

  it("drops an entire treasure stack together", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    state.track[0] = {
      ...state.track[0],
      type: "blank",
      bundle: null,
    };

    state.players[0].cargo = [
      {
        id: "stack-1",
        treasures: [
          { id: "t1", level: 1, value: 1 },
          { id: "t2", level: 2, value: 5 },
          { id: "t3", level: 3, value: 9 },
        ],
      },
    ];

    const updatedState = dropTreasure(
      state,
      state.players[0].id,
      "stack-1",
    );

    expect(updatedState.players[0].cargo).toHaveLength(0);

    expect(
      updatedState.track[0].bundle?.treasures,
    ).toHaveLength(3);
  });

  it("rejects actions from a non-current player", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[1].diver.position = 1;

    expect(() =>
      pickUpTreasure(state, state.players[1].id),
    ).toThrow();
  });

  it("rejects dropping a bundle that does not exist", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    state.players[0].diver.position = 1;

    const pickedState = pickUpTreasure(
      state,
      state.players[0].id,
    );

    expect(() =>
      dropTreasure(
        pickedState,
        pickedState.players[0].id,
        "invalid-bundle-id",
      ),
    ).toThrow();
  });

  it("does not allow picking up when all blank chips are in use", () => {
    const state = setupGame(["Player 1", "Player 2"]);

    for (let i = 0; i < 12; i++) {
      state.track[i] = {
        ...state.track[i],
        type: "blank",
        bundle: null,
      };
    }

    state.players[0].diver.position = 13;

    expect(
      canPickUpTreasure(state, state.players[0]),
    ).toBe(false);
  });
});
