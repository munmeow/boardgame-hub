
import type { CSSProperties } from "react";

import type {
  GameState,
  Treasure,
} from "../types";

import { PLAYER_COLORS } from "../constants/ui";

import { calculateScore } from "../engine/scoring";

interface Props {
  state: GameState;
  botIds?: string[];
  side?: "left" | "right" | "all";
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

function CollectedTreasure({
  treasure,
}: {
  treasure: Treasure;
}) {
  return (
    <div
      className="dsa-collected-treasure"
      title={`Level ${treasure.level}: ${treasure.value} points`}
    >
      <svg
        viewBox="0 0 80 80"
        role="img"
        aria-label={`${treasure.value} points`}
      >
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
          stroke="#00000030"
          strokeWidth="2"
        />

        <text
          x="40"
          y={treasure.level === 1 ? 53 : 47}
          textAnchor="middle"
          fontSize="25"
          fontWeight="800"
          fill="#172033"
        >
          {treasure.value}
        </text>
      </svg>
    </div>
  );
}

export default function PlayerPanel({
  state,
  side = "all",
}: Props) {
  const splitIndex = Math.ceil(
    state.players.length / 2,
  );

  const players = state.players
    .map((player, index) => ({
      player,
      index,
    }))
    .filter(({ index }) => {
      if (side === "left") {
        return index < splitIndex;
      }

      if (side === "right") {
        return index >= splitIndex;
      }

      return true;
    });

  return (
    <div
      className={
        `dsa-player-column dsa-player-column--${side}`
      }
    >
      {players.map(({ player, index }) => {
        const color =
          PLAYER_COLORS[
            index % PLAYER_COLORS.length
          ];

        const isActive =
          state.phase === "playing" &&
          state.currentPlayerIndex === index;

        const score = calculateScore(player);

        return (
          <article
            key={player.id}
            className={[
              "dsa-compact-player",
              isActive
                ? "dsa-compact-player--active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              "--player-color": color,
            } as CSSProperties}
          >
            <header className="dsa-compact-player-header">
              <span className="dsa-player-color" />

              <span className="dsa-compact-player-name">
                {player.name}
              </span>
            </header>

            <div className="dsa-compact-player-stats">
              <div className="dsa-compact-stat">
                <span>Cargo</span>

                <strong>
                  {player.cargo.length}
                </strong>
              </div>

              <div className="dsa-compact-stat dsa-compact-score">
                <span>Score</span>

                <strong>
                  {score}
                </strong>
              </div>
            </div>

            {player.cargo.length > 0 && (
              <div className="dsa-cargo-treasures" aria-label="Carried treasure bundles">
                {player.cargo.map((bundle) => (
                  <div className="dsa-cargo-bundle" key={bundle.id}
                    title={bundle.treasures.map(t => `Level ${t.level}`).join(", ")}>
                    {bundle.treasures.map((treasure) => (
                      <svg key={treasure.id} viewBox="0 0 80 80" role="img" aria-label={`Level ${treasure.level} treasure`}>
                        <polygon points={TREASURE_SHAPES[treasure.level]} fill={TREASURE_COLORS[treasure.level]}
                          stroke="#ffffff90" strokeWidth="3" strokeLinejoin="round" />
                      </svg>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {player.collected.length > 0 && (
              <div className="dsa-collected-treasures">
                {player.collected.map((treasure) => (
                  <CollectedTreasure
                    key={treasure.id}
                    treasure={treasure}
                  />
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
