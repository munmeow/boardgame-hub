
import type { GameState } from "../types";

import { calculateScore } from "../engine/scoring";

import { PLAYER_COLORS } from "./GameBoard";

interface Props {
  state: GameState;
  botIds: string[];
}

export default function PlayerPanel({
  state,
  botIds,
}: Props) {
  return (
    <section className="dsa-players">
      {state.players.map((player, index) => (
        <article
          key={player.id}
          className={
            "dsa-panel " +
            (
              state.phase === "playing" &&
              index === state.currentPlayerIndex
                ? "dsa-active-player"
                : ""
            )
          }
        >
          <h3
            style={{
              color: PLAYER_COLORS[index],
            }}
          >
            {player.name}

            {botIds.includes(player.id)
              ? " (Bot)"
              : ""}
          </h3>

          <p>Position: {player.diver.position}</p>

          <p>
            Direction:{" "}
            {player.diver.direction === "outward"
              ? "↓ Diving"
              : "↑ Returning"}
          </p>

          <p>Cargo: {player.cargo.length}</p>

          <p>Score: {calculateScore(player)}</p>

          {player.diver.returned && (
            <strong>Safely returned</strong>
          )}
        </article>
      ))}
    </section>
  );
}
