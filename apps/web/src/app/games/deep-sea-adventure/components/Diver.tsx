
import type { CSSProperties } from "react";
import "../styles/diver.css";

interface Props {
  color: string;
  name: string;
  direction: "outward" | "inward";
  isJumping?: boolean;
  isTurning?: boolean;
  isActive?: boolean;
  isReturned?: boolean;
  facingLeft?: boolean;
}

export default function Diver({
  color,
  name,
  direction,
  isJumping = false,
  isTurning = false,
  isActive = false,
  isReturned = false,
  facingLeft,
}: Props) {
  const facesLeft =
    facingLeft ?? direction === "inward";

  const className = [
    "dsa-diver",
    isJumping ? "dsa-diver--jumping" : "",
    isTurning ? "dsa-diver--turning" : "",
    isActive ? "dsa-diver--active" : "",
    isReturned ? "dsa-diver--returned" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      style={
        {
          "--diver-color": color,
          "--diver-facing": facesLeft ? -1 : 1,
        } as CSSProperties
      }
      title={name}
      role="img"
      aria-label={`${name}, ${direction}`}
    >
      <div className="dsa-diver-shadow" />

      <div className="dsa-diver-jump">
        <div className="dsa-diver-facing">
          <div className="dsa-diver-idle">
            <svg
              className="dsa-diver-svg"
              viewBox="0 0 100 120"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Oxygen tank */}
              <rect
                x="19"
                y="42"
                width="20"
                height="49"
                rx="9"
                fill="#94a3b8"
                stroke="#334155"
                strokeWidth="2"
              />

              <rect
                x="23"
                y="43"
                width="6"
                height="45"
                rx="3"
                fill="#e2e8f0"
                opacity="0.8"
              />

              {/* Tank valve */}
              <rect
                x="25"
                y="35"
                width="10"
                height="9"
                rx="2"
                fill="#64748b"
              />

              {/* Rear arm */}
              <path
                d="M42 51 L30 68 L34 80"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
              />

              {/* Rear leg */}
              <path
                d="M43 80 L34 96 L32 106"
                stroke={color}
                strokeWidth="13"
                strokeLinecap="round"
                fill="none"
              />

              {/* Rear flipper */}
              <path
                d="M27 103 L38 103 L51 112
                   Q53 117 47 117 L25 113 Z"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Front leg */}
              <path
                d="M58 81 L66 96 L68 106"
                stroke={color}
                strokeWidth="13"
                strokeLinecap="round"
                fill="none"
              />

              {/* Front flipper */}
              <path
                d="M62 103 L73 103 L87 112
                   Q89 117 82 117 L60 113 Z"
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Body */}
              <rect
                x="35"
                y="40"
                width="32"
                height="47"
                rx="13"
                fill={color}
                stroke="#1e293b"
                strokeWidth="2"
              />

              {/* Suit highlight */}
              <rect
                x="54"
                y="46"
                width="6"
                height="32"
                rx="3"
                fill="#ffffff"
                opacity="0.2"
              />

              {/* Tank harness */}
              <path
                d="M40 44 L45 83"
                stroke="#1e293b"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Waist belt */}
              <rect
                x="35"
                y="76"
                width="32"
                height="7"
                rx="3"
                fill="#1e293b"
              />

              {/* Front arm */}
              <path
                d="M59 50 L76 63 L82 52"
                stroke={color}
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Glove */}
              <circle
                cx="82"
                cy="51"
                r="6"
                fill="#1e293b"
              />

              {/* Head */}
              <circle
                cx="53"
                cy="25"
                r="18"
                fill={color}
                stroke="#1e293b"
                strokeWidth="2"
              />

              {/* Diving mask */}
              <rect
                x="49"
                y="17"
                width="24"
                height="17"
                rx="7"
                fill="#0f172a"
              />

              <rect
                x="52"
                y="20"
                width="18"
                height="11"
                rx="4"
                fill="#a5f3fc"
              />

              {/* Mask reflection */}
              <path
                d="M55 22 L62 22 L56 28"
                stroke="#ffffff"
                strokeWidth="2"
                opacity="0.8"
                fill="none"
              />

              {/* Breathing regulator */}
              <circle
                cx="67"
                cy="36"
                r="6"
                fill="#334155"
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Oxygen hose */}
              <path
                d="M68 37
                   Q85 47 70 66
                   Q48 81 29 42"
                stroke="#1e293b"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="dsa-diver-bubbles">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      <span className="dsa-diver-name">
        {name}
      </span>
    </div>
  );
}
