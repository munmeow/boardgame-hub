import { useEffect, useState, type MouseEvent } from "react";
import DeepSeaAdventure from "./games/deep-sea-adventure/components/DeepSeaAdventure";
import "./hub.css";
import PrivateRooms from "./online/PrivateRooms";

const GAME_ROUTE = "#/games/abyss-relay";


const GUIDE = [
  { title: "Check oxygen", summary: "Manage the shared oxygen supply.", detail: "Every dive starts with 25 shared oxygen. At the beginning of each diver's turn, subtract one oxygen per carried treasure bundle. With three cargo, 25 becomes 22. Carrying nothing costs no oxygen." },
  { title: "Choose your direction", summary: "Explore deeper or turn back once.", detail: "Choose your direction before rolling. Once you turn toward the submarine, you cannot turn outward again during that dive." },
  { title: "Roll and move", summary: "Roll two dice and subtract cargo.", detail: "Each die has values from 1 to 3. Subtract your cargo count from the sum, with a minimum movement of zero. Skip occupied spaces without counting them." },
  { title: "Collect or drop relics", summary: "Balance treasure value and cargo weight.", detail: "After moving, you may pick up the treasure bundle on your space, drop one carried bundle on an empty space, or skip. Deeper relics have higher potential values. A stack counts as one cargo." },
  { title: "Return safely", summary: "Get back before the dive ends.", detail: "When shared oxygen reaches zero or less, the current diver completes their turn. Returned divers secure their treasure; stranded divers lose the cargo they are carrying. Lost treasure becomes stacks for later dives." },
  { title: "Win after three dives", summary: "Recover the highest total treasure value.", detail: "Add the values of your safely recovered relics across all three dives. The highest total score wins." },
];

function Relic({ level }: { level: number }) {
  return <svg className="bgh-relic" viewBox="0 0 40 40" aria-hidden="true"><polygon points={["20,2 38,36 2,36","4,4 36,4 36,36 4,36","20,2 38,15 31,38 9,38 2,15","10,2 30,2 39,20 30,38 10,38 1,20"][level - 1]} fill={["#d6b78a","#94a3b8","#60a5fa","#a78bfa"][level - 1]} /></svg>;
}

function GuideVisual({ step }: { step: number }) {
  switch (step) {
    case 0: return <><div className="bgh-visual-row"><span>Start of dive</span><strong>25 / 25</strong></div><div className="bgh-oxygen-bar"><span style={{width:"100%"}} /></div><div className="bgh-visual-center">{[1,2,3].map(level => <Relic key={level} level={level} />)}<strong>−3 oxygen</strong></div><div className="bgh-visual-row"><span>After breathing</span><strong>22 / 25</strong></div><div className="bgh-oxygen-bar"><span style={{width:"88%"}} /></div></>;
    case 1: return <svg className="bgh-rule-svg" viewBox="0 0 300 100" role="img" aria-label="Explore away from the submarine, then return toward it"><rect x="8" y="30" width="80" height="35" rx="17" fill="#eab308"/><rect x="35" y="19" width="28" height="15" rx="4" fill="#facc15"/>{[28,48,68].map(x=><circle key={x} cx={x} cy="47" r="7" fill="#164e63"/>)}<path d="M105 30 H280 l-10 -8 m10 8 -10 8" fill="none" stroke="#67e8f9" strokeWidth="3"/><path d="M280 76 H105 l10 -8 m-10 8 10 8" fill="none" stroke="#facc15" strokeWidth="3"/><text x="195" y="18" fill="#67e8f9" fontSize="12" textAnchor="middle">Explore</text><text x="195" y="64" fill="#facc15" fontSize="12" textAnchor="middle">Return</text></svg>;
    case 2: return <><div className="bgh-visual-center">{[3,2].map(n=><svg key={n} className="bgh-die" viewBox="0 0 50 50" role="img" aria-label={String(n)}><rect x="2" y="2" width="46" height="46" rx="9" fill="#f1f5f9"/><circle cx="14" cy="14" r="4" fill="#071827"/><circle cx="36" cy="36" r="4" fill="#071827"/>{n===3 && <circle cx="25" cy="25" r="4" fill="#071827"/>}</svg>)}<span>− 2 cargo</span></div><div className="bgh-visual-result">3 + 2 − 2 = 3 steps</div></>;
    case 3: return <><div className="bgh-visual-center">{[1,2,3,4].map(level=><div key={level} style={{textAlign:"center"}}><Relic level={level}/><div>Lv. {level}</div></div>)}</div><div className="bgh-visual-result">One bundle or stack = one cargo</div></>;
    case 4: return <div className="bgh-visual-row"><div className="bgh-score-chip"><strong style={{color:"#4ade80"}}>✓ Returned</strong>Relics secured</div><div className="bgh-score-chip"><strong style={{color:"#fb7185"}}>× Stranded</strong>Cargo lost</div></div>;
    default: return <><div className="bgh-visual-row">{[8,11,14].map((score,i)=><div className="bgh-score-chip" key={i}>Dive {i+1}<strong>{score}</strong></div>)}</div><div className="bgh-visual-result">Total score: 33</div></>;
  }
}

function QuickStart() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? selected;
  return <section className="bgh-rules" id="how-to-play" aria-labelledby="bgh-rules-title">
    <p className="bgh-eyebrow">QUICK START · ABYSS RELAY</p>
    <h2 id="bgh-rules-title">How to play</h2>
    <p className="bgh-rules-intro">Hover or tap a step to see an illustrated example.</p>
    <div className="bgh-rules-grid">{GUIDE.map((rule,i)=>{
      const open = active === i;
      return <article key={rule.title} className="bgh-rule" data-open={open} onPointerEnter={event=>{if(event.pointerType==="mouse") setHovered(i);}} onPointerLeave={()=>setHovered(current=>current===i?null:current)}>
        <button type="button" className="bgh-rule-trigger" aria-expanded={open} aria-controls={`bgh-rule-detail-${i}`} onClick={()=>{setHovered(null);setSelected(current=>current===i?null:i);}}>
          <span className="bgh-rule-number">0{i+1}</span><span className="bgh-rule-copy"><strong>{rule.title}</strong><small>{rule.summary}</small></span><span className="bgh-rule-chevron" aria-hidden="true">⌄</span>
        </button>
        <div className="bgh-rule-expand" id={`bgh-rule-detail-${i}`} aria-hidden={!open}><div className="bgh-rule-clip"><div className="bgh-rule-detail"><div className="bgh-rule-visual"><GuideVisual step={i}/></div><p>{rule.detail}</p></div></div></div>
      </article>;
    })}</div>
    <p className="bgh-rules-tip"><strong>Tip:</strong> More cargo means slower movement and greater oxygen consumption.</p>
  </section>;
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
                  <button className="bgh-rules-link" type="button" onClick={()=>document.getElementById("how-to-play")?.scrollIntoView({behavior:"smooth"})}>How to play</button>
                  <p className="bgh-note">Expert is a special challenge with privileged information and emergency dice assistance.</p>
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
          <QuickStart />
          <footer className="bgh-footer">Development preview · Private rooms and online gameplay.</footer>
        </main>
      )}
    </div>
  );
}
