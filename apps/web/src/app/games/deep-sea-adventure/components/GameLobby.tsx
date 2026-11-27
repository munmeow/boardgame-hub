
import { useState } from "react";
import type { CSSProperties } from "react";
import type { BotDifficulty } from "../bot/bot";
import { PLAYER_COLORS } from "../constants/ui";
import "../styles/bot.css";

export interface LobbyPlayer {
  name: string;
  isBot: boolean;
  difficulty?: BotDifficulty;
}

interface GameLobbyProps {
  onStart: (players: LobbyPlayer[]) => void;
}

interface BotProfile {
  name: string;
  description: string;
  color: string;
  stars: number;
}

const BOT_PROFILES: Record<BotDifficulty, BotProfile> = {
  easy: {
    name: "Easy",
    description: "Safe and predictable play.",
    color: "#22c55e",
    stars: 1,
  },

  normal: {
    name: "Normal",
    description:
      "More adventurous and willing to take risks.",
    color: "#38bdf8",
    stars: 2,
  },

  hard: {
    name: "Hard",
    description:
      "Smart decisions and efficient treasure hunting.",
    color: "#f59e0b",
    stars: 3,
  },

  expert: {
    name: "Expert",
    description:
      "You can't win. But you can try.",
    color: "#ef4444",
    stars: 4,
  },
};

const DIFFICULTIES: BotDifficulty[] = [
  "easy",
  "normal",
  "hard",
  "expert",
];

function DifficultyStars({ count }: { count: number }) {
  return (
    <div
      className="dsa-difficulty-stars"
      aria-label={`${count} out of 4 stars`}
    >
      {Array.from({ length: 4 }, (_, index) => (
        <span
          key={index}
          className={
            index < count
              ? "dsa-star-filled"
              : "dsa-star-empty"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function GameLobby({
  onStart,
}: GameLobbyProps) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([
    {
      name: "Player 1",
      isBot: false,
      difficulty: "normal",
    },
    {
      name: "Player 2",
      isBot: true,
      difficulty: "normal",
    },
  ]);

  const updatePlayer = (
    index: number,
    updates: Partial<LobbyPlayer>
  ) => {
    setPlayers((previous) =>
      previous.map((player, playerIndex) =>
        playerIndex === index
          ? { ...player, ...updates }
          : player
      )
    );
  };

  const addPlayer = () => {
    setPlayers((previous) => {
      if (previous.length >= 6) return previous;

      let number = previous.length + 1;

      while (
        previous.some(
          (player) => player.name === `Player ${number}`
        )
      ) {
        number++;
      }

      return [
        ...previous,
        {
          name: `Player ${number}`,
          isBot: false,
          difficulty: "normal",
        },
      ];
    });
  };

  const removePlayer = (index: number) => {
    setPlayers((previous) =>
      previous.length <= 2
        ? previous
        : previous.filter(
            (_, playerIndex) => playerIndex !== index
          )
    );
  };

  const valid =
    players.length >= 2 &&
    players.length <= 6 &&
    players.every(
      (player) => player.name.trim().length > 0
    );

  const handleStart = () => {
    if (!valid) return;

    onStart(
      players.map((player) => ({
        ...player,
        name: player.name.trim(),
        difficulty: player.difficulty ?? "normal",
      }))
    );
  };

  return (
    <section className="dsa-lobby dsa-enhanced-lobby">

      {/* HEADER */}

      <header className="dsa-lobby-header">
        <h1>Abyss Relay</h1>
        <p>Prepare your diving crew</p>
      </header>

      <div className="dsa-lobby-content">

        {/* PLAYER SETUP */}

        <div className="dsa-lobby-setup">
          <div className="dsa-lobby-section-heading">
            <h2>Your Crew</h2>

            <span className="dsa-player-count">
              {players.length}/6 Players
            </span>
          </div>

          <div className="dsa-lobby-player-list">
            {players.map((player, index) => {
              const difficulty =
                player.difficulty ?? "normal";

              const profile = BOT_PROFILES[difficulty];

              return (
                <article
                  key={index}
                  className="dsa-lobby-player-card"
                  style={
                    {
                      "--player-color":
                        PLAYER_COLORS[index],
                      "--bot-color": profile.color,
                    } as CSSProperties
                  }
                >
                  <div className="dsa-lobby-player-top">

                    <div className="dsa-lobby-avatar">
                      {player.isBot ? "AI" : index + 1}
                    </div>

                    <input
                      className="dsa-player-name"
                      aria-label={`Player ${index + 1} name`}
                      type="text"
                      value={player.name}
                      maxLength={24}
                      placeholder="Player name"
                      onChange={(event) =>
                        updatePlayer(index, {
                          name: event.target.value,
                        })
                      }
                    />

                    <select
                      className="dsa-player-type"
                      aria-label={`Player ${index + 1} type`}
                      value={
                        player.isBot ? "bot" : "human"
                      }
                      onChange={(event) =>
                        updatePlayer(index, {
                          isBot:
                            event.target.value === "bot",
                        })
                      }
                    >
                      <option value="human">Human</option>
                      <option value="bot">Bot</option>
                    </select>

                    {players.length > 2 && (
                      <button
                        type="button"
                        className="dsa-remove-player"
                        aria-label={`Remove player ${index + 1}`}
                        title="Remove player"
                        onClick={() => removePlayer(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {player.isBot && (
                    <div className="dsa-bot-select-row">
                      <label
                        htmlFor={`difficulty-${index}`}
                      >
                        Difficulty
                      </label>

                      <select
                        id={`difficulty-${index}`}
                        className="dsa-bot-difficulty"
                        value={difficulty}
                        onChange={(event) =>
                          updatePlayer(index, {
                            difficulty:
                              event.target
                                .value as BotDifficulty,
                          })
                        }
                      >
                        {DIFFICULTIES.map((level) => (
                          <option
                            key={level}
                            value={level}
                          >
                            {BOT_PROFILES[level].name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className="dsa-add-player-button"
            disabled={players.length >= 6}
            onClick={addPlayer}
          >
            + Add Player
          </button>

          <button
            type="button"
            className="dsa-start-adventure-button"
            disabled={!valid}
            onClick={handleStart}
          >
            ▶ Start Adventure
          </button>
        </div>

        {/* BOT GUIDE */}

        <aside className="dsa-bot-guide">
          <div className="dsa-lobby-section-heading">
            <h2>Bot Difficulty Guide</h2>
          </div>

          <div className="dsa-bot-guide-list">
            {DIFFICULTIES.map((difficulty) => {
              const profile = BOT_PROFILES[difficulty];

              return (
                <article
                  key={difficulty}
                  className="dsa-bot-profile"
                  style={
                    {
                      "--bot-color": profile.color,
                    } as CSSProperties
                  }
                >
                  <div className="dsa-bot-profile-header">
                    <div className="dsa-bot-profile-icon">
                      AI
                    </div>

                    <h3>{profile.name}</h3>

                    <DifficultyStars
                      count={profile.stars}
                    />
                  </div>

                  <p>{profile.description}</p>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
