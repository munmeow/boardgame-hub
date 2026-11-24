
import {
  useState,
  useEffect,
  useCallback,
} from "react";

import type { GameState } from "../types";

import { setupGame } from "../engine/setup";

import {
  applyAction,
  type GameAction,
} from "../engine/actions";

import { getCurrentPlayer } from "../engine/state";

import { chooseBotAction } from "../bot/bot";

import GameLobby, {
  type LobbyPlayer,
} from "./GameLobby";

import GameBoard from "./GameBoard";
import OxygenMeter from "./OxygenMeter";
import PlayerPanel from "./PlayerPanel";
import ActionPanel from "./ActionPanel";
import ScoreBoard from "./ScoreBoard";

import "../styles/game.css";

export default function DeepSeaAdventure() {
  const [state, setState] =
    useState<GameState | null>(null);

  const [botIds, setBotIds] =
    useState<string[]>([]);

  const [error, setError] =
    useState<string | null>(null);

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!state) return;

      try {
        const nextState = applyAction(
          state,
          action,
        );

        setState(nextState);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown game error.",
        );
      }
    },
    [state],
  );

  function handleStart(
    lobbyPlayers: LobbyPlayer[],
  ) {
    try {
      const newState = setupGame(
        lobbyPlayers.map(
          (player) => player.name,
        ),
      );

      const newBotIds = newState.players
        .filter(
          (_, index) =>
            lobbyPlayers[index].isBot,
        )
        .map((player) => player.id);

      setBotIds(newBotIds);
      setState(newState);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start game.",
      );
    }
  }

  function handleRestart() {
    setState(null);
    setBotIds([]);
    setError(null);
  }

  const currentPlayer =
    state?.phase === "playing"
      ? getCurrentPlayer(state)
      : null;

  const isBotTurn =
    currentPlayer !== null &&
    botIds.includes(currentPlayer.id);

  useEffect(() => {
    if (
      !state ||
      state.phase !== "playing" ||
      !isBotTurn ||
      error
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const action = chooseBotAction(
        state,
        "normal",
      );

      if (action) {
        dispatch(action);
      }
    }, 700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state, isBotTurn, dispatch, error]);

  if (!state) {
    return (
      <main className="dsa-game">
        <GameLobby onStart={handleStart} />

        {error && (
          <p className="dsa-error">{error}</p>
        )}
      </main>
    );
  }

  return (
    <main className="dsa-game">
      <header className="dsa-header">
        <div>
          <h1>Deep Sea Adventure</h1>

          <p>Dive {state.round} / 3</p>
        </div>

        <button onClick={handleRestart}>
          Back to lobby
        </button>
      </header>

      <OxygenMeter oxygen={state.oxygen} />

      {state.lastTurn &&
        state.phase === "playing" && (
          <div className="dsa-warning">
            Oxygen depleted. This is the final turn.
          </div>
        )}

      <GameBoard state={state} />

      <PlayerPanel
        state={state}
        botIds={botIds}
      />

      <ActionPanel
        state={state}
        isBot={isBotTurn}
        onAction={dispatch}
      />

      <ScoreBoard
        state={state}
        onNextRound={() =>
          dispatch({ type: "NEXT_ROUND" })
        }
        onRestart={handleRestart}
      />

      {error && (
        <p className="dsa-error">{error}</p>
      )}
    </main>
  );
}
