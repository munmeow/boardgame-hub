
import type { GameState } from "../types";

export const PLAYER_COLORS = [
  "#f43f5e",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
];

interface Props {
  state: GameState;
}

export default function GameBoard({
  state,
}: Props) {
  function renderDivers(position: number) {
    return state.players.map((player, index) =>
      player.diver.position === position ? (
        <span
          key={player.id}
          className="dsa-diver"
          title={player.name}
          style={{
            backgroundColor: PLAYER_COLORS[index],
          }}
        >
          {index + 1}
        </span>
      ) : null,
    );
  }

  return (
    <section className="dsa-board">
      <div className="dsa-tile dsa-submarine">
        <div className="dsa-divers">
          {renderDivers(0)}
        </div>

        <span>🚢</span>
        <small>Submarine</small>
      </div>

      {state.track.map((tile, index) => {
        const level =
          tile.bundle?.treasures[0]?.level ?? 0;

        return (
          <div
            key={tile.id}
            className="dsa-tile"
          >
            <div className="dsa-divers">
              {renderDivers(index + 1)}
            </div>

            <div
              className={
                `dsa-chip dsa-level-${level}`
              }
            >
              {tile.type === "blank"
                ? "–"
                : `L${level}`}

              {(tile.bundle?.treasures.length ?? 0) >
                1 && (
                <small>
                  ×{tile.bundle!.treasures.length}
                </small>
              )}
            </div>

            <small>{index + 1}</small>
          </div>
        );
      })}
    </section>
  );
}
