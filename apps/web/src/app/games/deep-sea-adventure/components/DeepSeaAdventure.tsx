
import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import type {
  GameState,
  DiceResult,
} from "@boardgame-hub/abyss-relay/types";

import { setupGame } from "@boardgame-hub/abyss-relay/engine/setup";

import {
  applyAction,
  type GameAction,
} from "@boardgame-hub/abyss-relay/engine/actions";

import { rollDice } from "@boardgame-hub/abyss-relay/engine/turn";

import {
  calculateMovement,
  getMovementPath,
} from "@boardgame-hub/abyss-relay/engine/movement";

import {
  getCurrentPlayer,
} from "@boardgame-hub/abyss-relay/engine/state";

import {
  chooseBotAction,
  resetOpponentModel,
  observeBotOpponentAction,
  recordCommittedRoll,
  type BotDifficulty,
} from "@boardgame-hub/abyss-relay/bot/bot";

import {
  useDiverAnimation,
  DIVER_ANIMATION,
} from "../hooks/useDiverAnimation";

import GameLobby, {
  type LobbyPlayer,
} from "./GameLobby";

import GameBoard from "./GameBoard";
import OxygenMeter from "./OxygenMeter";
import PlayerPanel from "./PlayerPanel";
import ActionPanel from "./ActionPanel";
import ScoreBoard from "./ScoreBoard";
import DiceRoller from "./DiceRoller";

import "../styles/game.css";
import { DICE_ROLL_CONFIG } from "../constants/ui";

type AnimationPhase =
  | "idle"
  | "turning"
  | "rolling"
  | "showing-result"
  | "moving";

interface DiceDisplay {
  result: DiceResult;
  cargoCount: number;
}

export default function DeepSeaAdventure() {
  const [state, setState] =
    useState<GameState | null>(null);

  const [botLevels, setBotLevels] =
    useState<Partial<Record<string, BotDifficulty>>>({});

  const [error, setError] =
    useState<string | null>(null);

  const [animationPhase, setAnimationPhase] =
    useState<AnimationPhase>("idle");

  const [diceDisplay, setDiceDisplay] =
    useState<DiceDisplay | null>(null);

  const [rollDuration, setRollDuration] = useState<number>(DICE_ROLL_CONFIG.BOT_ROLL_DURATION);

  const busyRef = useRef(false);

  const sequenceRef = useRef(0);

  const previousTreasureCountsRef = useRef<
  Record<string, number>
>({});

  const {
    animation,
    isAnimating,
    animateTurnBack,
    animateMovement,
    cancelAnimation,
    clearAnimation,
  } = useDiverAnimation();

  const isBusy =
    animationPhase !== "idle" ||
    isAnimating;

  const isRolling =
    animationPhase === "rolling";

  const isMoving =
    animationPhase === "moving";

  const isTurning =
    animationPhase === "turning";

  const wait = useCallback(
    (duration: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(
          resolve,
          duration,
        );
      }),
    [],
  );

  const dispatch = useCallback(
    async (action: GameAction, requestedDuration?: number) => {
      if (!state || busyRef.current) {
        return;
      }

      const sequence =
        ++sequenceRef.current;

      const isCurrent = () =>
        sequence === sequenceRef.current;

      busyRef.current = true;

      setError(null);

      try {
        if (
          action.type ===
          "DECLARE_DIRECTION" &&
          action.turnBack
        ) {
          const player =
            getCurrentPlayer(state);

          const nextState =
            applyAction(state, action);

          setAnimationPhase("turning");

          setDiceDisplay(null);

          const completed =
            await animateTurnBack({
              playerId: player.id,
              position: player.diver.position,
            });

          if (
            !completed ||
            !isCurrent()
          ) {
            return;
          }

          observeBotOpponentAction(state, action);

          setState(nextState);

          clearAnimation();

          return;
        }

        if (action.type === "ROLL_DICE") {
          const player =
            getCurrentPlayer(state);

          const dice =
            action.dice ?? rollDice();

          const cargoCount =
            player.cargo.length;

          const steps =
            calculateMovement(
              dice.total,
              cargoCount,
            );

          const path = getMovementPath(
            state,
            player,
            steps,
          );

          // Calculate the final state once.
          const nextState = applyAction(
            state,
            {
              type: "ROLL_DICE",
              dice,
            },
          );

          setDiceDisplay(null);

          setAnimationPhase("rolling");

          const duration = requestedDuration === undefined || !Number.isFinite(requestedDuration)
            ? DICE_ROLL_CONFIG.BOT_ROLL_DURATION
            : Math.max(DICE_ROLL_CONFIG.MIN_ROLL_DURATION, Math.min(DICE_ROLL_CONFIG.MAX_ROLL_DURATION, requestedDuration));
          setRollDuration(duration);
          await wait(duration);

          if (!isCurrent()) return;

          setDiceDisplay({
            result: dice,
            cargoCount,
          });

          setAnimationPhase(
            "showing-result",
          );

          await wait(
            DIVER_ANIMATION.DICE_RESULT_DELAY,
          );

          if (!isCurrent()) return;

          if (path.length > 0) {
            setAnimationPhase("moving");

            const completed =
              await animateMovement({
                playerId: player.id,

                startPosition:
                  player.diver.position,

                path,

                direction:
                  player.diver.direction,
              });

            if (
              !completed ||
              !isCurrent()
            ) {
              return;
            }

            // Hold briefly at the landing position.
            await wait(180);

            if (!isCurrent()) return;
          }

          recordCommittedRoll(state, { type: "ROLL_DICE", dice });

          setState(nextState);

          clearAnimation();

          return;
        }


const nextState = applyAction(state, action);

// Save collected treasure counts before the next dive
if (action.type === "NEXT_ROUND") {
  previousTreasureCountsRef.current =
    Object.fromEntries(
      state.players.map((player) => [
        player.id,
        player.collected.length,
      ]),
    );
}

observeBotOpponentAction(state, action);

setState(nextState);

clearAnimation();

if (
  action.type === "START_TURN" ||
  action.type === "NEXT_ROUND"
) {
  setDiceDisplay(null);
}

      } catch (err) {
        if (!isCurrent()) return;

        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred.",
        );

        cancelAnimation();
      } finally {
        if (isCurrent()) {
          busyRef.current = false;

          setAnimationPhase("idle");
        }
      }
    },
    [
      state,
      wait,
      animateTurnBack,
      animateMovement,
      clearAnimation,
      cancelAnimation,
    ],
  );

  function handleStart(
    lobbyPlayers: LobbyPlayer[],
  ) {
    try {

      previousTreasureCountsRef.current = {};

      sequenceRef.current++;

      cancelAnimation();

      busyRef.current = false;

      setAnimationPhase("idle");

      setDiceDisplay(null);

      const newState = setupGame(
        lobbyPlayers.map(
          (player) => player.name,
        ),
      );

      const levels: Partial<Record<string, BotDifficulty>> = {};
      newState.players.forEach((player, index) => {
        if (lobbyPlayers[index].isBot) {
          levels[player.id] = lobbyPlayers[index].difficulty ?? "normal";
        }
      });
      resetOpponentModel();
      setBotLevels(levels);

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

  const handleRestart = () => {
    resetOpponentModel();

    previousTreasureCountsRef.current = {};

    sequenceRef.current++;

    cancelAnimation();

    busyRef.current = false;

    setAnimationPhase("idle");

    setDiceDisplay(null);

    setState(null);

    setBotLevels({});

    setError(null);
  };

  useEffect(() => {
    return () => {
      sequenceRef.current++;

      busyRef.current = false;
    };
  }, []);

  const currentPlayer =
    state?.phase === "playing"
      ? getCurrentPlayer(state)
      : null;

  const botDifficulty = currentPlayer ? botLevels[currentPlayer.id] : undefined;
  const isBotTurn = botDifficulty !== undefined;

  useEffect(() => {
    if (
      !state ||
      state.phase !== "playing" ||
      !isBotTurn ||
      isBusy ||
      error
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const action = chooseBotAction(
        state,
        botDifficulty ?? "normal",
      );

      if (action) {
        void dispatch(action);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    state,
    isBotTurn,
    botDifficulty,
    isBusy,
    error,
    dispatch,
  ]);

  if (!state) {
    return (
      <main className="dsa-game">
        <GameLobby onStart={handleStart} />

        {error && (
          <p className="dsa-error">
            {error}
          </p>
        )}
      </main>
    );
  }


  const showDice =
    state.phase === "playing" &&
    (
      state.turnStage === "declare" ||
      state.turnStage === "swim" ||
      state.turnStage === "treasure" ||
      animationPhase !== "idle" ||
      diceDisplay !== null
    );

  return (
    <main className={`dsa-game dsa-game--vertical ${state.phase !== "playing" ? "dsa-summary-active" : ""}`}>
      <header className="dsa-header">
        <div>
          <h1>Abyss Relay</h1>

          <p>
            Dive {state.round} / 3
          </p>
        </div>

        <button onClick={handleRestart}>
          Back to lobby
        </button>
      </header>

      <div className="dsa-game-layout">
        {/* LEFT: GAME BOARD */}

        <div className="dsa-main-board">
          <div className="dsa-table-layout">

            {/* LEFT PLAYERS */}
            <PlayerPanel
              state={state}
              side="left"
            />

            {/* GAME BOARD */}
            <div className="dsa-table-center">
              <GameBoard
                state={state}
                animation={animation}
              />
            </div>

            {/* RIGHT PLAYERS */}
            <PlayerPanel
              state={state}
              side="right"
            />

          </div>
        </div>


{/* RIGHT: CONTROL SIDEBAR */}
<aside className="dsa-sidebar">
  <OxygenMeter oxygen={state.oxygen} />

  {state.lastTurn &&
    state.phase === "playing" && (
      <div className="dsa-warning">
        Oxygen depleted.
        This is the final turn.
      </div>
    )}

  {state.phase === "playing" && (
    <div className="dsa-control-card">
      {currentPlayer && (
        <div className="dsa-current-turn">
          <span className="dsa-turn-indicator" />

          <div>
            <span className="dsa-turn-label">
              CURRENT TURN
            </span>

            <h2>
              {currentPlayer.name}
            </h2>
            {botDifficulty && <span className="dsa-bot-level">{botDifficulty.toUpperCase()} BOT</span>}
          </div>
        </div>
      )}

            {showDice && (
              <DiceRoller
                rolling={isRolling}
                rollDuration={rollDuration}
                moving={isMoving}
                turning={isTurning}
                result={
                  diceDisplay?.result ??
                  state.diceResult
                }
                cargoCount={
                  diceDisplay?.cargoCount ??
                  currentPlayer?.cargo.length ??
                  0
                }
              />
            )}

            {isBusy ? (
              <div
                className="dsa-animation-status"
                aria-live="polite"
              >
                <span className="dsa-loading-dot" />

                {animationPhase === "turning" &&
                  "Turning back..."}

                {animationPhase === "rolling" &&
                  "Rolling dice..."}

                {animationPhase ===
                  "showing-result" &&
                  "Preparing to move..."}

                {animationPhase === "moving" &&
                  "Diver is moving..."}
              </div>
            ) : (
              <ActionPanel
                state={state}
                isBot={isBotTurn}
                isRolling={false}
                onAction={(action, duration) => {
                  void dispatch(action, duration);
                }}
              />
            )}
          </div>
  )}

          {error && (
            <p className="dsa-error">
              {error}
            </p>
          )}
                </aside>
      </div>

{!isBusy && state.phase !== "playing" && state.phase !== "setup" && (
  <ScoreBoard
    key={state.round}
    state={state}
    previousTreasureCounts={
      previousTreasureCountsRef.current
    }
    onNextRound={() => {
      void dispatch({
        type: "NEXT_ROUND",
      });
    }}
    onRestart={handleRestart}
  />
)}

    </main>
  );
}

