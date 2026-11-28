
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";

import type {
  GameState,
  Treasure,
} from "@boardgame-hub/abyss-relay/types";

import {
  getRankings,
  compareScores,
} from "@boardgame-hub/abyss-relay/engine/scoring";

import { PLAYER_COLORS } from "../constants/ui";

import "../styles/scoreboard.css";

import { useEffect, useState } from "react";
import { playGameSound } from "../../../gameSound";

interface Props {
  state: GameState;
  onNextRound: () => void;
  hostControlsDisabled?: boolean;
  onRestart: () => void;
  restartLabel?: string;
  previousTreasureCounts: Record<string, number>;
}

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

function TreasureReveal({
  treasure,
  index,
}: {
  treasure: Treasure;
  index: number;
}) {
  return (
    <div
      className="dsa-result-treasure"
      style={{
        animationDelay: `${Math.min(index * 60, 300) + 120}ms`,
      }}
      title={`${treasure.value} points`}
    >
      <svg viewBox="0 0 80 80">
        <polygon
          points={TREASURE_SHAPES[treasure.level]}
          fill={TREASURE_COLORS[treasure.level]}
          stroke="#ffffff90"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <polygon
          points={TREASURE_SHAPES[treasure.level]}
          transform="translate(8 8) scale(.8)"
          fill="none"
          stroke="#00000035"
          strokeWidth="2"
        />

        <text
          x="40"
          y={treasure.level === 1 ? 53 : 47}
          textAnchor="middle"
          fontSize="26"
          fontWeight="800"
          fill="#172033"
        >
          {treasure.value}
        </text>
      </svg>
    </div>
  );
}

function Trophy() {
  return (
    <svg
      className="dsa-result-trophy"
      viewBox="0 0 160 140"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="dsa-trophy-gold"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>

      <path
        d="M40 22 H15 V42 Q15 65 48 65
           M120 22 H145 V42 Q145 65 112 65"
        stroke="#eab308"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M38 12 H122 V48
           Q122 82 80 92
           Q38 82 38 48 Z"
        fill="url(#dsa-trophy-gold)"
        stroke="#fde68a"
        strokeWidth="2"
      />

      <path
        d="M52 25 V48 Q52 65 64 71"
        stroke="#fef9c3"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M80 29 L87 43 L103 45
           L91 57 L94 73 L80 65
           L66 73 L69 57 L57 45 L73 43 Z"
        fill="#a16207"
      />

      <rect
        x="72"
        y="88"
        width="16"
        height="26"
        rx="4"
        fill="#eab308"
      />

      <rect
        x="49"
        y="109"
        width="62"
        height="13"
        rx="5"
        fill="#facc15"
      />

      <rect
        x="39"
        y="120"
        width="82"
        height="12"
        rx="4"
        fill="#a16207"
      />
    </svg>
  );
}

function Confetti() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);
  const colors = [
    "#facc15",
    "#38bdf8",
    "#a78bfa",
    "#fb7185",
    "#4ade80",
    "#ffffff",
  ];

  if (!visible) return null;
  return (
    <div
      className="dsa-result-confetti"
      aria-hidden="true"
    >
      {Array.from({ length: 24 }, (_, index) => (
        <span
          key={index}
          style={{
            left: `${(index * 37) % 100}%`,
            background: colors[index % colors.length],

            "--confetti-delay":
              `${(index % 6) * 60}ms`,

            "--confetti-duration":
              `${1900 + (index % 4) * 100}ms`,

            "--confetti-drift":
              `${(index % 2 === 0 ? 1 : -1) *
              (30 + (index % 5) * 20)}px`,

            "--confetti-spin":
              `${360 + (index % 6) * 180}deg`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

export default function ScoreBoard({
  state,
  onNextRound,
  hostControlsDisabled = false,
  onRestart,
  restartLabel = "↻ New game",
  previousTreasureCounts,
}: Props) {
  const [showFinalResults, setShowFinalResults] =
    useState(false);

  if (
    state.phase !== "round-ended" &&
    state.phase !== "finished"
  ) {
    return null;
  }

  const isGameFinished =
    state.phase === "finished";

  const isFinal =
    isGameFinished && showFinalResults;

  const rankings = getRankings(state);

  const winners = rankings.filter(
    (ranking) =>
      compareScores(ranking, rankings[0]) === 0,
  );

  const winnerNames = winners
    .map((winner) => winner.name)
    .join(" & ");

  const winnerTitle =
    winners.length === 1
      ? `${winnerNames} Wins!`
      : `${winnerNames} Tie!`;

  const roundResults = state.players.map(
    (player, index) => {
      const previousCount =
        previousTreasureCounts[player.id] ?? 0;

      const newTreasures =
        player.collected.slice(previousCount);

      const roundScore = newTreasures.reduce(
        (sum, treasure) => sum + treasure.value,
        0,
      );

      return {
        player,
        color:
          PLAYER_COLORS[index % PLAYER_COLORS.length],
        newTreasures,
        roundScore,
      };
    },
  );

  return createPortal(
    <div className="dsa-result-overlay">

      {isFinal && <Confetti />}

      <section
        key={isFinal ? "final-results" : "dive-results"}
        className={[
          "dsa-result-modal",
          isFinal ? "dsa-result-modal--final" : "",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dsa-result-title"
      >
        <header className="dsa-result-header">
          <span className="dsa-result-eyebrow">
            ABYSS RELAY
          </span>

          {isFinal ? (
            <>
              <Trophy />

              <span className="dsa-result-final-label">
                GAME COMPLETE
              </span>

              <h1 id="dsa-result-title">
                {winnerTitle}
              </h1>

              <strong className="dsa-result-winning-score">
                {rankings[0]?.score ?? 0}
              </strong>

              <span className="dsa-result-subtitle">
                Final score
              </span>
            </>
          ) : (
            <>
              <div className="dsa-result-dive-icon">
                ⚓
              </div>

              <h1 id="dsa-result-title">
                DIVE {state.round} COMPLETE
              </h1>

              <span className="dsa-result-subtitle">
                {isGameFinished
                  ? "All dives completed"
                  : `${3 - state.round} ${3 - state.round === 1
                    ? "dive"
                    : "dives"
                  } remaining`}
              </span>
            </>
          )}
        </header>

        {isFinal ? (
          <div className="dsa-result-rankings">
            {rankings.map((ranking, index) => {
              const playerIndex =
                state.players.findIndex(
                  (player) =>
                    player.id === ranking.playerId,
                );

              const collectedTreasures =
                state.players[playerIndex]?.collected ?? [];

              const color =
                PLAYER_COLORS[
                Math.max(0, playerIndex) %
                PLAYER_COLORS.length
                ];

              const rank =
                rankings.findIndex(
                  (item) =>
                    compareScores(item, ranking) === 0,
                ) + 1;

              return (
                <div
                  key={ranking.playerId}
                  className={[
                    "dsa-result-ranking",
                    rank === 1
                      ? "dsa-result-ranking--winner"
                      : "",
                  ].join(" ")}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    "--player-color": color,
                  } as CSSProperties}
                >
                  <span
                    className={
                      `dsa-result-rank dsa-result-rank--${rank}`
                    }
                  >
                    {rank}
                  </span>

                  <span className="dsa-result-player-color" />

                  <div className="dsa-result-ranking-info">
                    <strong>{ranking.name}</strong>

                    <div className="dsa-result-ranking-treasures">
                      {collectedTreasures.map(
                        (treasure, treasureIndex) => (
                          <TreasureReveal
                            key={treasure.id}
                            treasure={treasure}
                            index={treasureIndex}
                          />
                        ),
                      )}

                      {collectedTreasures.length === 0 && (
                        <span className="dsa-result-empty">
                          No treasures recovered
                        </span>
                      )}
                    </div>
                  </div>


                  <strong className="dsa-result-ranking-score">
                    {ranking.score}
                  </strong>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dsa-result-players">
            {roundResults.map(
              ({
                player,
                color,
                newTreasures,
                roundScore,
              }) => (
                <article
                  key={player.id}
                  className="dsa-result-player"
                  style={{
                    "--player-color": color,
                  } as CSSProperties}
                >
                  <div className="dsa-result-player-header">
                    <span className="dsa-result-player-color" />

                    <strong>{player.name}</strong>

                    <span
                      className={[
                        "dsa-result-player-status",
                        player.diver.returned
                          ? "dsa-result-status--safe"
                          : "dsa-result-status--lost",
                      ].join(" ")}
                    >
                      {player.diver.returned
                        ? "Safely returned"
                        : "Lost at sea"}
                    </span>
                  </div>

                  <div className="dsa-result-player-body">
                    <div className="dsa-result-treasures">
                      {newTreasures.map(
                        (treasure, index) => (
                          <TreasureReveal
                            key={treasure.id}
                            treasure={treasure}
                            index={index}
                          />
                        ),
                      )}

                      {newTreasures.length === 0 && (
                        <span className="dsa-result-empty">
                          {player.diver.returned
                            ? "No treasures collected"
                            : "No treasures recovered"}
                        </span>
                      )}
                    </div>

                    <div className="dsa-result-player-points">
                      <strong>+{roundScore}</strong>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}


        <footer className="dsa-result-footer">
          <button
            className="dsa-result-primary-button"
            onClick={() => {
              if (isFinal) {
                onRestart();
                return;
              }

              if (isGameFinished) {
                setShowFinalResults(true);
                playGameSound("victory");
                return;
              }

              onNextRound();
            }}
            disabled={hostControlsDisabled && (isFinal || !isGameFinished)}
            autoFocus
          >
            {hostControlsDisabled && (isFinal || !isGameFinished)
              ? "Waiting for host…"
              : isFinal
              ? restartLabel
              : isGameFinished
                ? "View Final Results →"
                : "Next Dive →"}
          </button>
        </footer>
      </section>
    </div>,
    document.querySelector(".bgh-shell") ?? document.body,
  );
}
