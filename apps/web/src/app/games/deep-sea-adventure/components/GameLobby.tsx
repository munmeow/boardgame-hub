
import { useState } from "react";

export interface LobbyPlayer {
  name: string;
  isBot: boolean;
}

interface Props {
  onStart: (players: LobbyPlayer[]) => void;
}

export default function GameLobby({
  onStart,
}: Props) {
  const [players, setPlayers] = useState<
    LobbyPlayer[]
  >([
    { name: "Player 1", isBot: false },
    { name: "Bot 1", isBot: true },
  ]);

  function updatePlayer(
    index: number,
    changes: Partial<LobbyPlayer>,
  ) {
    setPlayers((previous) =>
      previous.map((player, i) =>
        i === index
          ? { ...player, ...changes }
          : player,
      ),
    );
  }

  function addPlayer() {
    if (players.length >= 6) return;

    setPlayers((previous) => [
      ...previous,
      {
        name: `Player ${previous.length + 1}`,
        isBot: false,
      },
    ]);
  }

  function removePlayer(index: number) {
    if (players.length <= 2) return;

    setPlayers((previous) =>
      previous.filter((_, i) => i !== index),
    );
  }

  const valid = players.every(
    (player) => player.name.trim() !== "",
  );

  return (
    <section className="dsa-lobby">
      <h1>Deep Sea Adventure</h1>

      <p>Configure your diving team.</p>

      {players.map((player, index) => (
        <div
          className="dsa-lobby-row"
          key={index}
        >
          <input
            value={player.name}
            placeholder={`Player ${index + 1}`}
            onChange={(event) =>
              updatePlayer(index, {
                name: event.target.value,
              })
            }
          />

          <select
            value={player.isBot ? "bot" : "human"}
            onChange={(event) =>
              updatePlayer(index, {
                isBot: event.target.value === "bot",
              })
            }
          >
            <option value="human">Human</option>
            <option value="bot">Bot</option>
          </select>

          <button
            disabled={players.length <= 2}
            onClick={() => removePlayer(index)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        disabled={players.length >= 6}
        onClick={addPlayer}
      >
        Add player
      </button>

      <button
        disabled={!valid}
        onClick={() => onStart(players)}
      >
        Start game
      </button>
    </section>
  );
}
