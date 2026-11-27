
import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type {
  GameState,
  TrackTile,
} from "../types";

import type {
  DiverAnimationState,
} from "../hooks/useDiverAnimation";

import {
  PLAYER_COLORS,
  BOARD_UI,
} from "../constants/ui";

import Diver from "./Diver";

interface Props {
  state: GameState;
  animation?: DiverAnimationState | null;
}

interface BoardPosition {
  x: number;
  y: number;
  rotation: number;
  floatX: number;
  floatY: number;
  duration: number;
  delay: number;
}

function createRandom(seed: string) {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash = (hash + 0x6d2b79f5) | 0;

    let t = Math.imul(
      hash ^ (hash >>> 15),
      1 | hash,
    );

    t ^= t + Math.imul(
      t ^ (t >>> 7),
      61 | t,
    );

    return (
      ((t ^ (t >>> 14)) >>> 0) /
      4294967296
    );
  };
}

function getCoordinates(
  position: number,
  tileId: string,
): BoardPosition {
  if (position === 0) {
    return {
      x: BOARD_UI.SUBMARINE_X,
      y: BOARD_UI.SUBMARINE_Y,
      rotation: 0,
      floatX: 1,
      floatY: 3,
      duration: 5000,
      delay: 0,
    };
  }

  const random = createRandom(tileId);

  const index = position - 1;

  const row = Math.floor(
    index / BOARD_UI.COLUMNS,
  );

  const offset = index % BOARD_UI.COLUMNS;

  const column =
    row % 2 === 0
      ? offset
      : BOARD_UI.COLUMNS - 1 - offset;

  const randomX =
    (random() * 2 - 1) *
    BOARD_UI.RANDOM_OFFSET_X;

  const randomY =
    (random() * 2 - 1) *
    BOARD_UI.RANDOM_OFFSET_Y;

  const rotation =
    (random() * 2 - 1) *
    BOARD_UI.RANDOM_ROTATION;

  const floatX =
    BOARD_UI.FLOAT_MIN_X +
    random() *
      (
        BOARD_UI.FLOAT_MAX_X -
        BOARD_UI.FLOAT_MIN_X
      );

  const floatY =
    BOARD_UI.FLOAT_MIN_Y +
    random() *
      (
        BOARD_UI.FLOAT_MAX_Y -
        BOARD_UI.FLOAT_MIN_Y
      );

  const duration =
    BOARD_UI.FLOAT_MIN_DURATION +
    random() *
      (
        BOARD_UI.FLOAT_MAX_DURATION -
        BOARD_UI.FLOAT_MIN_DURATION
      );

  return {
    x:
      BOARD_UI.PADDING +
      column * BOARD_UI.CELL_WIDTH +
      BOARD_UI.CELL_WIDTH / 2 +
      randomX,

    y:
      BOARD_UI.TOP_SPACE +
      row * BOARD_UI.CELL_HEIGHT +
      randomY,

    rotation,
    floatX,
    floatY,
    duration,

    delay: -random() * duration,
  };
}

function getFloatingStyle(
  position: BoardPosition,
): CSSProperties {
  return {
    "--float-x": `${position.floatX}px`,
    "--float-y": `${position.floatY}px`,
    "--float-duration": `${position.duration}ms`,
    "--float-delay": `${position.delay}ms`,
    "--treasure-rotation":
      `${position.rotation}deg`,
  } as CSSProperties;
}

function getFacingLeft(
  position: number,
  direction: "outward" | "inward",
): boolean {
  if (position === 0) {
    return direction === "inward";
  }

  const row = Math.floor(
    (position - 1) / BOARD_UI.COLUMNS,
  );

  const outwardFacesLeft = row % 2 !== 0;

  return direction === "outward"
    ? outwardFacesLeft
    : !outwardFacesLeft;
}

function Submarine() {
  return (
    <svg
      className="dsa-submarine-svg"
      viewBox="0 0 240 130"
      role="img"
      aria-label="Submarine"
    >
      <defs>
        <linearGradient
          id="dsa-submarine-body"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#fde047"
          />
          <stop
            offset="55%"
            stopColor="#eab308"
          />
          <stop
            offset="100%"
            stopColor="#a16207"
          />
        </linearGradient>

        <radialGradient
          id="dsa-submarine-window"
        >
          <stop
            offset="0%"
            stopColor="#67e8f9"
          />
          <stop
            offset="100%"
            stopColor="#164e63"
          />
        </radialGradient>
      </defs>

      {/* Rear propeller */}
      <path
        d="M39 70 L12 43 L12 100 L39 82 Z"
        fill="#ca8a04"
        stroke="#713f12"
        strokeWidth="3"
      />

      {/* Main body */}
      <rect
        x="32"
        y="42"
        width="199"
        height="70"
        rx="35"
        fill="url(#dsa-submarine-body)"
        stroke="#854d0e"
        strokeWidth="3"
      />

      {/* Upper cabin */}
      <rect
        x="94"
        y="22"
        width="58"
        height="29"
        rx="9"
        fill="#facc15"
        stroke="#854d0e"
        strokeWidth="3"
      />

      {/* Periscope */}
      <path
        d="M120 22 V8 H145"
        stroke="#facc15"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Body highlight */}
      <path
        d="M57 53 H202"
        stroke="#fef9c3"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".8"
      />

      {/* Windows */}
      {[79, 131, 183].map((x) => (
        <g key={x}>
          <circle
            cx={x}
            cy="76"
            r="21"
            fill="#854d0e"
          />

          <circle
            cx={x}
            cy="76"
            r="16"
            fill="url(#dsa-submarine-window)"
            stroke="#fde68a"
            strokeWidth="3"
          />

          <ellipse
            cx={x - 5}
            cy="70"
            rx="5"
            ry="7"
            fill="#cffafe"
            opacity=".7"
          />
        </g>
      ))}

      {/* Lower hatch */}
      <rect
        x="94"
        y="105"
        width="52"
        height="11"
        rx="5"
        fill="#854d0e"
      />

      {/* Front light */}
      <circle
        cx="226"
        cy="75"
        r="6"
        fill="#fef9c3"
      />
    </svg>
  );
}

const TREASURE_SHAPES: Record<
  number,
  string
> = {
  1: "40,5 75,68 5,68",
  2: "10,10 70,10 70,70 10,70",
  3: "40,3 77,30 63,75 17,75 3,30",
  4: "20,5 60,5 78,40 60,75 20,75 2,40",
};

const TREASURE_COLORS: Record<
  number,
  string
> = {
  1: "#d6b78a",
  2: "#94a3b8",
  3: "#60a5fa",
  4: "#a78bfa",
};

function TreasureChip({
  tile,
}: {
  tile: TrackTile;
}) {
  if (
    tile.type === "blank" ||
    !tile.bundle
  ) {
    return (
      <div className="dsa-chip-blank">
        <span />
      </div>
    );
  }

  const treasures = tile.bundle.treasures;

  const level =
    treasures[0]?.level ?? 1;

  const count = treasures.length;

  return (
    <div
      className={
        `dsa-treasure-chip dsa-level-${level}`
      }
      aria-label={
        `Level ${level} treasure, ${count} chips`
      }
    >
      <svg
        viewBox="0 0 90 90"
        aria-hidden="true"
      >
        {treasures
          .slice(1)
          .reverse()
          .map((treasure, index) => (
            <polygon
              key={treasure.id}
              points={
                TREASURE_SHAPES[
                  treasure.level
                ]
              }
              fill={
                TREASURE_COLORS[
                  treasure.level
                ]
              }
              stroke="#ffffff60"
              strokeWidth="2"
              strokeLinejoin="round"
              transform={
                `translate(${8 - index * 3} ${
                  10 - index * 3
                })`
              }
            />
          ))}

        <polygon
          points={TREASURE_SHAPES[level]}
          fill={TREASURE_COLORS[level]}
          stroke="#ffffff90"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <polygon
          points={TREASURE_SHAPES[level]}
          fill="none"
          stroke="#00000035"
          strokeWidth="2"
          transform="
            translate(8 8)
            scale(.8)
          "
        />
      </svg>

      {count > 1 && (
        <span className="dsa-stack-count">
          ×{count}
        </span>
      )}
    </div>
  );
}

export default function GameBoard({
  state,
  animation = null,
}: Props) {
  const positions: BoardPosition[] = [
    getCoordinates(0, "submarine"),

    ...state.track.map((tile, index) =>
      getCoordinates(index + 1, tile.id),
    ),
  ];

  const rows = Math.ceil(
    state.track.length /
      BOARD_UI.COLUMNS,
  );

  const boardWidth =
    BOARD_UI.COLUMNS *
      BOARD_UI.CELL_WIDTH +
    BOARD_UI.PADDING * 2;

  const boardHeight =
    BOARD_UI.TOP_SPACE +
    Math.max(0, rows - 1) *
      BOARD_UI.CELL_HEIGHT +
    65;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const fit = () => {
      const desktop = window.innerWidth > 800;
      const availableHeight = window.innerHeight - element.getBoundingClientRect().top - 18;
      const widthScale = element.clientWidth / boardWidth;
      const heightScale = desktop ? availableHeight / boardHeight : 1;
      setScale(Math.max(desktop ? .55 : .65, Math.min(1, widthScale, heightScale)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    window.addEventListener("resize", fit);
    return () => { observer.disconnect(); window.removeEventListener("resize", fit); };
  }, [boardWidth, boardHeight]);

  const route = positions
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

  return (
    <section className="dsa-board-panel">
      <div className="dsa-board-scroll" ref={scrollRef}>
        <div className="dsa-board-fit" style={{ width: boardWidth * scale, height: boardHeight * scale }}>
        <div
          className="dsa-board-canvas"
          style={{
            width: boardWidth,
            height: boardHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div className="dsa-water-surface" />

          <div
            className="dsa-ocean-rays"
            aria-hidden="true"
          />

          <div
            className="dsa-ocean-particles"
            aria-hidden="true"
          >
            {Array.from(
              { length: 12 },
              (_, index) => {
                const random =
                  createRandom(
                    `particle-${index}`,
                  );

                return (
                  <span
                    key={index}
                    style={{
                      left:
                        `${random() * 100}%`,

                      top:
                        `${random() * 100}%`,

                      width:
                        `${2 + random() * 5}px`,

                      height:
                        `${2 + random() * 5}px`,

                      animationDelay:
                        `${-random() * 12}s`,

                      animationDuration:
                        `${8 + random() * 8}s`,
                    }}
                  />
                );
              },
            )}
          </div>

          <svg
            className="dsa-board-route"
            width={boardWidth}
            height={boardHeight}
            aria-hidden="true"
          >
            <polyline
              points={route}
              fill="none"
              stroke="#a5f3fc"
              strokeOpacity=".2"
              strokeWidth="2"
              strokeDasharray="4 8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Submarine */}
          <div
            className="dsa-board-cell dsa-board-submarine"
            style={{
              left: positions[0].x,
              top: positions[0].y,
              ...getFloatingStyle(
                positions[0],
              ),
            }}
          >
            <div className="dsa-float-motion">
              <Submarine />
            </div>
          </div>

          {/* Treasure track */}
          {state.track.map((tile, index) => {
            const position =
              positions[index + 1];

            return (
              <div
                key={tile.id}
                className="dsa-board-cell"
                style={{
                  left: position.x,
                  top: position.y,

                  ...getFloatingStyle(
                    position,
                  ),
                }}
              >
                <div className="dsa-float-motion">
                  <div className="dsa-treasure-rotation">
                    <TreasureChip tile={tile} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Independent diver layer */}
          <div className="dsa-diver-layer">
            {state.players.map(
              (player, index) => {
                const currentAnimation =
                  animation?.playerId ===
                    player.id
                    ? animation
                    : null;

                const position =
                  currentAnimation?.position ??
                  player.diver.position;

                const direction =
                  currentAnimation?.direction ??
                  player.diver.direction;

                const coordinates =
                  positions[position] ??
                  positions[0];

                const atSubmarine =
                  position === 0;

                const offsetX =
                  atSubmarine
                    ? (index % 3 - 1) * 34
                    : 0;

                const offsetY =
                  atSubmarine
                    ? Math.floor(index / 3) * 18
                    : 0;

                const duration =
                  currentAnimation?.duration ??
                  0;

                const active =
                  state.phase === "playing" &&
                  state.currentPlayerIndex ===
                    index;

                const jumping =
                  currentAnimation?.isJumping ??
                  false;

                return (
                  <div
                    key={player.id}
                    className="dsa-diver-position"
                    style={{
                      transform:
                        `translate3d(
                          ${
                            coordinates.x -
                            BOARD_UI.DIVER_WIDTH / 2 +
                            offsetX
                          }px,
                          ${
                            coordinates.y -
                            (BOARD_UI.DIVER_HEIGHT - 5) +
                            offsetY
                          }px,
                          0
                        )`,

                      transitionDuration:
                        jumping
                          ? `${duration}ms`
                          : "0ms",

                      zIndex: active ? 50 : 10,

                      "--diver-jump-duration":
                        `${duration || 350}ms`,

                      ...getFloatingStyle(
                        coordinates,
                      ),
                    } as CSSProperties}
                  >
                    <div
                      className={
                        jumping
                          ? "dsa-diver-float dsa-diver-float--jumping"
                          : "dsa-diver-float"
                      }
                    >
                      <Diver
                        name={player.name}
                        color={
                          PLAYER_COLORS[
                            index %
                            PLAYER_COLORS.length
                          ]
                        }
                        direction={direction}
                        facingLeft={
                          getFacingLeft(
                            position,
                            direction,
                          )
                        }
                        isJumping={jumping}
                        isTurning={
                          currentAnimation
                            ?.isTurning
                        }
                        isActive={active}
                        isReturned={
                          player.diver.returned
                        }
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <div
            className="dsa-ocean-floor"
            aria-hidden="true"
          />
        </div>
        </div>
      </div>
    </section>
  );
}
