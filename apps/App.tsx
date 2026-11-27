import { useEffect, useState, type MouseEvent } from "react";
import DeepSeaAdventure from "./games/deep-sea-adventure/components/DeepSeaAdventure";
import "./hub.css";
import PrivateRooms from "./online/PrivateRooms";

const GAME_ROUTE = "#/games/abyss-relay";

const QUICK_START = [
  { title: "Check oxygen", text: "Each dive starts with 25 shared oxygen. At the start of your turn, spend one oxygen per cargo bundle you carry." },
  { title: "Choose your direction", text: "Explore deeper or turn back toward the submarine. Once you turn back, you cannot dive outward again until the next dive." },
  { title: "Hold to roll", text: "Hold and release the roll button. Roll two dice (1–3 each), subtract your cargo count and move the remaining steps. Skip occupied spaces without counting them." },
  { title: "Collect or drop relics", text: "Pick up treasure on your landing space, drop one cargo bundle on an empty space, or skip. Deeper treasures generally have higher values. A stack counts as one cargo bundle." },
  { title: "Return safely", text: "Reach the submarine to secure your cargo. When oxygen reaches zero or less, the current player finishes their turn and the dive ends. Divers still outside lose their cargo." },
  { title: "Win after three dives", text: "Collect the highest total treasure value over three dives. Hidden treasure values are revealed when you successfully bring them back at the end of a dive." },
];

const GUIDE_SUMMARIES = [
  "Manage the shared oxygen supply.",
  "Explore deeper or turn back once.",
  "Roll two dice and subtract cargo.",
  "Collect, drop or skip treasure.",
  "Make it back before the dive ends.",
  "Earn the highest total score.",
];

function GuideVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <div className="bgh-guide-visual">
        <div className="bgh-example-label"><span>Start of dive</span><strong>25 / 25</strong></div>
        <div className="bgh-air-track"><span style={{ width: "100%" }} /></div>
        <div className="bgh-example-cargo"><i className="bgh-relic bgh-relic--1"/><i className="bgh-relic bgh-relic--2"/><i className="bgh-relic bgh-relic--3"/><span>3 cargo = −3 oxygen</span></div>
        <div className="bgh-example-label"><span>After breathing</span><strong>22 / 25</strong></div>
        <div className="bgh-air-track"><span style={{ width: "88%" }} /></div>
      </div>;
    case 1:
      return <div className="bgh-guide-visual">
        <svg viewBox="0 0 280 100" role="img" aria-label="Explore outward or return toward the submarine">
          <g fill="#eab308"><rect x="8" y="37" width="64" height="29" rx="14"/><rect x="30" y="27" width="20" height="12" rx="3"/></g>
          <g fill="#164e63"><circle cx="26" cy="51" r="5"/><circle cx="43" cy="51" r="5"/><circle cx="59" cy="51" r="5"/></g>
          <path d="M90 32 H250 l-10 -8 m10 8 -10 8" fill="none" stroke="#67e8f9" strokeWidth="3"/>
          <path d="M250 75 H90 l10 -8 m-10 8 10 8" fill="none" stroke="#facc15" strokeWidth="3"/>
          <text x="170" y="20" fill="#67e8f9" fontSize="12" textAnchor="middle">Explore</text><text x="170" y="62" fill="#facc15" fontSize="12" textAnchor="middle">Return (one-way)</text>
        </svg>
      </div>;
    case 2:
      return <div className="bgh-guide-visual">
        <div className="bgh-dice-example"><span className="bgh-example-die" aria-label="3">⚂</span><span>+</span><span className="bgh-example-die" aria-label="2">⚁</span><span>− 2 cargo</span></div>
        <div className="bgh-example-result">5 − 2 = <strong>3 steps</strong></div>
        <div className="bgh-step-example" aria-hidden="true"><span>1</span><span>2</span><span>3</span></div>
      </div>;
    case 3:
      return <div className="bgh-guide-visual">
        <div className="bgh-level-example">{[1,2,3,4].map(level => <div key={level}><i className={`bgh-relic bgh-relic--${level}`} /><small>Lv. {level}</small></div>)}</div>
        <div className="bgh-example-result">Pick up → carry → return</div>
        <div className="bgh-example-label"><span>One stack = one cargo</span><strong>×3 relics</strong></div>
      </div>;
    case 4:
      return <div className="bgh-guide-visual bgh-return-example">
        <div><strong className="bgh-safe">✓ Returned</strong><span>Relics secured</span><i className="bgh-relic bgh-relic--3"/></div>
        <div><strong className="bgh-lost">✕ Stranded</strong><span>Cargo lost</span><i className="bgh-relic bgh-relic--3 bgh-relic-lost"/></div>
      </div>;
    default:
      return <div className="bgh-guide-visual">
        <div className="bgh-score-example">{[8,11,14].map((score,i) => <div key={i}><small>Dive {i+1}</small><strong>{score}</strong></div>)}</div>
        <div className="bgh-example-result">Total score: <strong>33</strong></div>
      </div>;
  }
}

function QuickStartCard({ rule, index }: { rule: (typeof QUICK_START)[number]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = expanded || hovered;
  return (
    <li className={`bgh-rule bgh-rule--interactive${open ? " bgh-rule--open" : ""}`}
      onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}>
      <button type="button" className="bgh-rule-toggle" aria-expanded={open}
        aria-controls={`bgh-rule-detail-${index}`}
        onClick={() => { setExpanded(!open); setHovered(false); }}
        onKeyDown={event => { if (event.key === "Escape") { setExpanded(false); setHovered(false); } }}>
        <span className="bgh-rule-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span className="bgh-rule-copy"><strong>{rule.title}</strong><span>{GUIDE_SUMMARIES[index]}</span></span>
        <span className="bgh-rule-chevron" aria-hidden="true">⌄</span>
      </button>
      <div id={`bgh-rule-detail-${index}`} className="bgh-rule-detail" inert={!open}>
        <div className="bgh-rule-detail-inner">
          <GuideVisual index={index}/>
          <p>{rule.text}</p>
          {index === 0 && <p className="bgh-guide-extra">Example: 25 − 3 = 22 oxygen. The cost is paid at the start of each player's own turn, not once per dive.</p>}
          {index === 2 && <p className="bgh-guide-extra">Movement cannot go below zero. Holding longer changes animation duration, not the dice result.</p>}
        </div>
      </div>
    </li>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash);
  const playing = route === GAME_ROUTE;
  const online = route.startsWith("#/rooms");
  useEffect(() => {
    const sync = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    document.title = playing ? "Abyss Relay | Boardgame Hub" : "Boardgame Hub";
  }, [playing]);
  function leaveGame(event: MouseEvent<HTMLAnchorElement>) {
    if (!window.confirm("Return to the game library? Your current local game will be lost.")) {
      event.preventDefault();
    }
  }
  return (
    <div className={`bgh-shell ${(playing || online) ? "bgh-shell--playing" : ""}`}>
      <header className="bgh-header">
        <a className="bgh-brand" href="#/" onClick={playing ? leaveGame : undefined}>
          <span className="bgh-logo" aria-hidden="true">◆</span>
          <span>Boardgame Hub</span>
        </a>
        {playing ? (
          <a className="bgh-back" href="#/" onClick={leaveGame}>Game library</a>
        ) : (
          <span className="bgh-status">Online rooms</span>
        )}
      </header>
      {playing ? (
        <DeepSeaAdventure />
      ) : online ? (
        <PrivateRooms />
      ) : (
        <main className="bgh-home">
          <section className="bgh-intro">
            <p className="bgh-eyebrow">THE GAME LIBRARY</p>
            <h1>Find your next adventure.</h1>
            <p>Play at your own pace, challenge a bot, or share a screen with friends.</p>
          </section>
          <section aria-labelledby="bgh-games-title">
            <h2 id="bgh-games-title">Available games</h2>
            <div className="bgh-grid">
              <article className="bgh-game-card">
                <div className="bgh-cover" aria-hidden="true">
                  <div className="bgh-cover-ring bgh-cover-ring--outer" />
                  <div className="bgh-cover-ring bgh-cover-ring--inner" />
                  <div className="bgh-cover-mark">◆</div>
                  <span className="bgh-cover-label">ABYSS RELAY</span>
                </div>
                <div className="bgh-card-body">
                  <p className="bgh-eyebrow">STRATEGY · PUSH YOUR LUCK</p>
                  <h3>Abyss Relay</h3>
                  <p>Explore the depths, recover relics and make it back before the shared air supply runs out.</p>
                  <div className="bgh-tags"><span>2–6 players</span><span>Local &amp; bots</span></div>
                  <a className="bgh-primary" href={GAME_ROUTE}>Play local</a>
                  <p className="bgh-note">Expert is a special challenge with privileged information and emergency dice assistance.</p>
                  <button className="bgh-rules-link" type="button" onClick={() => document.getElementById("bgh-rules")?.scrollIntoView({ block: "start" })}>How to play ↓</button>
                </div>
              </article>
              <article className="bgh-coming">
                <p className="bgh-eyebrow">ONLINE MULTIPLAYER</p>
                <h3>Private rooms</h3>
                <p>Play with friends on separate devices using an invitation code.</p>
                <a className="bgh-primary" href="#/rooms">Create / Join Room</a>
              </article>
            </div>
          </section>
          <section id="bgh-rules" className="bgh-rules" aria-labelledby="bgh-rules-title">
            <p className="bgh-eyebrow">QUICK START · ABYSS RELAY</p>
            <h2 id="bgh-rules-title">How to play</h2>
            <p className="bgh-rules-intro">Bring back valuable relics without running out of air. Play three dives with 2–6 players.</p>
            <p className="bgh-guide-hint">Hover or tap a step to see an illustrated example.</p>
            <ol className="bgh-rules-grid">
              {QUICK_START.map((rule, index) => (
                <QuickStartCard key={rule.title} rule={rule} index={index} />
              ))}
            </ol>
            <p className="bgh-rules-tip"><strong>Tip:</strong> More cargo means slower movement and greater oxygen consumption. Plan your return early.</p>
          </section>
          <footer className="bgh-footer">Development preview · Private rooms and online gameplay.</footer>
        </main>
      )}
    </div>
  );
}
