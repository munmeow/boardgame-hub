
import type { GameState } from "../types";

import {
  getRankings,
  getWinners,
} from "../engine/scoring";

interface Props {
  state: GameState;
  onNextRound: () => void;
  onRestart: () => void;
}

export default function ScoreBoard({
  state,
  onNextRound,
  onRestart,
}: Props) {
  if (
    state.phase !== "round-ended" &&
    state.phase !== "finished"
  ) {
    return null;
  }

  const rankings = getRankings(state);

  const finished = state.phase === "finished";

  const winners = finished
    ? getWinners(state)
    : [];

  return (
    <section className="dsa-panel">
      <h2>
        {finished
          ? "Final results"
          : `Dive ${state.round} completed`}
      </h2>

      {finished && (
        <h3>
          {winners.length > 1
            ? "Draw: "
            : "Winner: "}

          {winners
            .map((winner) => winner.name)
            .join(", ")}
        </h3>
      )}

      <table className="dsa-score-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Treasures</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          {rankings.map((player) => (
            <tr key={player.playerId}>
              <td>{player.name}</td>
              <td>{player.treasureCount}</td>
              <td>{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {finished ? (
        <button onClick={onRestart}>
          New game
        </button>
      ) : (
        <button onClick={onNextRound}>
          Next dive
        </button>
      )}
    </section>
  );
}
