import { useEffect, useRef, useState } from "react";
import { calculateMovement } from "@boardgame-hub/abyss-relay/engine/movement";
import { TREASURE_LEVELS } from "@boardgame-hub/abyss-relay/rules/constants";
import DeepSeaAdventure from "./games/deep-sea-adventure/components/DeepSeaAdventure";
import "./hub.css";
import PrivateRooms from "./online/PrivateRooms";
import FullscreenButton from "./FullscreenButton";
import GameSoundButton from "./GameSoundButton";
import SpicyAid from "./tools/spicy/SpicyAid";
import CardPlaytest from "./games/card-playtest/CardPlaytest";

const GAME_ROUTE = "#/games/abyss-relay";
const SPICY_AID_ROUTE = "#/tools/spicy";
const PLAYTEST_ROUTE = "#/games/card-playtest";


const GUIDE = [
  { title: "Check oxygen", summary: "Manage the shared oxygen supply.", detail: "Every dive starts with 25 shared oxygen. At the beginning of each diver's turn, subtract one oxygen per carried treasure bundle. With three cargo, 25 becomes 22. Carrying nothing costs no oxygen." },
  { title: "Choose your direction", summary: "Explore deeper or turn back once.", detail: "Choose your direction before rolling. Once you turn toward the submarine, you cannot turn outward again during that dive." },
  { title: "Roll and move", summary: "Roll two dice and subtract cargo.", detail: "Each die has values from 1 to 3. Subtract your cargo count from the sum, with a minimum movement of zero. Skip occupied spaces without counting them." },
  { title: "Collect or drop relics", summary: "Balance treasure value and cargo weight.", detail: "After moving, you may pick up the treasure bundle on your space, drop one carried bundle on an empty space, or skip." },
  { title: "Return safely", summary: "Get back before the dive ends.", detail: "When shared oxygen reaches zero or less, the current diver completes their turn. Returned divers secure their treasure; stranded divers lose the cargo they are carrying. Lost treasure becomes stacks for later dives." },
  { title: "Win after three dives", summary: "Recover the highest total treasure value.", detail: "Add the values of your safely recovered relics across all three dives. The highest total score wins." },
];

function Relic({ level }: { level: number }) {
  return <svg className="bgh-relic" viewBox="0 0 40 40" aria-hidden="true"><polygon points={["20,2 38,36 2,36","4,4 36,4 36,36 4,36","20,2 38,15 31,38 9,38 2,15","10,2 30,2 39,20 30,38 10,38 1,20"][level - 1]} fill={["#d6b78a","#94a3b8","#60a5fa","#a78bfa"][level - 1]} /></svg>;
}

function MovementExample() {
  const dice = [3, 2];
  const total = dice[0] + dice[1];
  return (
    <>
      <div className="bgh-visual-center">
        {dice.map((face, index) => (
          <div className="bgh-example-die" key={index}>
            {index > 0 && <span>+</span>}
            <svg className="bgh-die" viewBox="0 0 50 50" role="img" aria-label={String(face)}>
              <rect x="2" y="2" width="46" height="46" rx="9" fill="#f1f5f9" />
              <circle cx="14" cy="14" r="4" fill="#071827" />
              <circle cx="36" cy="36" r="4" fill="#071827" />
              {face === 3 && <circle cx="25" cy="25" r="4" fill="#071827" />}
            </svg>
          </div>
        ))}
        <strong>= {total} total</strong>
      </div>
      <ul className="bgh-move-examples" aria-label="Movement by cargo count">
        {["No cargo", "1 cargo", "2 cargo"].map((label, cargo) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{total} − {cargo} = {calculateMovement(total, cargo)} steps</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

function GuideVisual({ step }: { step: number }) {
  switch (step) {
    case 0: return <><div className="bgh-visual-row"><span>Start of dive</span><strong>25 / 25</strong></div><div className="bgh-oxygen-bar"><span style={{width:"100%"}} /></div><div className="bgh-visual-center">{[1,2,3].map(level => <Relic key={level} level={level} />)}<strong>−3 oxygen</strong></div><div className="bgh-visual-row"><span>After breathing</span><strong>22 / 25</strong></div><div className="bgh-oxygen-bar"><span style={{width:"88%"}} /></div></>;
    case 1: return <svg className="bgh-rule-svg" viewBox="0 0 300 100" role="img" aria-label="Explore away from the submarine, then return toward it"><rect x="8" y="30" width="80" height="35" rx="17" fill="#eab308"/><rect x="35" y="19" width="28" height="15" rx="4" fill="#facc15"/>{[28,48,68].map(x=><circle key={x} cx={x} cy="47" r="7" fill="#164e63"/>)}<path d="M105 30 H280 l-10 -8 m10 8 -10 8" fill="none" stroke="#67e8f9" strokeWidth="3"/><path d="M280 76 H105 l10 -8 m-10 8 10 8" fill="none" stroke="#facc15" strokeWidth="3"/><text x="195" y="18" fill="#67e8f9" fontSize="12" textAnchor="middle">Explore</text><text x="195" y="64" fill="#facc15" fontSize="12" textAnchor="middle">Return</text></svg>;
    case 2: return <MovementExample />;
    case 3: return (
      <>
        <ul className="bgh-relic-values" aria-label="Points per relic by level">
          {([1, 2, 3, 4] as const).map(level => {
            const { minValue, maxValue } = TREASURE_LEVELS[level];
            return (
              <li key={level}>
                <Relic level={level} />
                <div>
                  <div>Level {level}</div>
                  <strong>{minValue}–{maxValue} pts</strong>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="bgh-relic-weight">
          Each bundle, including a stack, counts as <strong>1 cargo</strong>.
          Each cargo costs 1 oxygen at the start of your turn and subtracts 1 step from your dice total.
        </p>
      </>
    );
    case 4: return <div className="bgh-visual-row"><div className="bgh-score-chip"><strong style={{color:"#4ade80"}}>✓ Returned</strong>Relics secured</div><div className="bgh-score-chip"><strong style={{color:"#fb7185"}}>× Stranded</strong>Cargo lost</div></div>;
    default: return <><div className="bgh-visual-row">{[8,11,14].map((score,i)=><div className="bgh-score-chip" key={i}>Dive {i+1}<strong>{score}</strong></div>)}</div><div className="bgh-visual-result">Total score: 33</div></>;
  }
}

function QuickStart() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button className="bgh-rules-link" type="button" aria-haspopup="dialog" aria-controls="how-to-play" onClick={() => dialog.current?.showModal()}>
        How to play
      </button>
      <dialog
        ref={dialog}
        className="bgh-rules"
        id="how-to-play"
        aria-labelledby="bgh-rules-title"
        onClick={event => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <header className="bgh-rules-header">
          <div>
            <p className="bgh-eyebrow">QUICK START · ABYSS RELAY</p>
            <h2 id="bgh-rules-title">How to play</h2>
          </div>
          <button type="button" className="bgh-rules-close" onClick={() => dialog.current?.close()}>Close</button>
        </header>
        <div className="bgh-rules-body">
          <div className="bgh-rules-grid">
            {GUIDE.map((rule, index) => (
              <article key={rule.title} className="bgh-rule">
                <header className="bgh-rule-heading">
                  <span className="bgh-rule-number">0{index + 1}</span>
                  <div className="bgh-rule-copy">
                    <h3>{rule.title}</h3>
                    <p>{rule.summary}</p>
                  </div>
                </header>
                <div className="bgh-rule-detail">
                  <div className="bgh-rule-visual"><GuideVisual step={index} /></div>
                  <p>{rule.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="bgh-rules-tip"><strong>Tip:</strong> More cargo means slower movement and greater oxygen consumption.</p>
        </div>
      </dialog>
    </>
  );
}

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash);
  const playing = route === GAME_ROUTE;
  const online = route.startsWith("#/rooms");
  const spicyAid = route === SPICY_AID_ROUTE;
  const playtest = route === PLAYTEST_ROUTE;

  useEffect(() => {
    const sync = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    document.title = playtest ? "Bàn chơi thử | Boardgame Hub" : spicyAid ? "Hỗ trợ chơi Spicy | Boardgame Hub" : playing || online ? "Abyss Relay | Boardgame Hub" : "Boardgame Hub";
  }, [online, playing, playtest, spicyAid]);

  return (
    <div className={`bgh-shell ${(playing || online) ? "bgh-shell--playing" : ""}`}>
      <header className="bgh-header">
        <a className="bgh-brand" href="#/">
          <span className="bgh-logo" aria-hidden="true">◆</span>
          <span>Boardgame Hub</span>
        </a>
        {(playing || online) && <div className="bgh-game-tools"><GameSoundButton /><FullscreenButton /></div>}
        {(playing || online) && <a className="bgh-back" href="#/">Game library</a>}
      </header>
      {playing ? (
        <DeepSeaAdventure />
      ) : online ? (
        <PrivateRooms />
      ) : spicyAid ? (
        <SpicyAid />
      ) : playtest ? (
        <CardPlaytest />
      ) : (
        <main className="bgh-home">
          <section className="bgh-intro">
            <p className="bgh-eyebrow">THE GAME LIBRARY</p>
            <h1>Find your next adventure.</h1>
            <p>Play at your own pace, challenge a bot, or share a screen with friends.</p>
          </section>
          <section aria-labelledby="bgh-games-title">
            <h2 id="bgh-games-title">Available games</h2>
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
                <a className="bgh-primary" href="#/rooms">Create / Join Room</a>
                <QuickStart />
                <p className="bgh-note">Expert is a special challenge with privileged information and emergency dice assistance.</p>
              </div>
            </article>
            <a className="bgh-primary bgh-playtest-link" lang="vi" href={PLAYTEST_ROUTE}>Mở bàn chơi thử · 0.1</a>
          </section>
          <section className="bgh-spicy-link" lang="vi" aria-labelledby="bgh-tools-title">
            <h2 id="bgh-tools-title">Công cụ hỗ trợ</h2>
            <a className="bgh-primary" href={SPICY_AID_ROUTE}>Hỗ trợ chơi Spicy</a>
          </section>
          <footer className="bgh-footer">Development preview · Online multiplayer.</footer>
        </main>
      )}
    </div>
  );
}
