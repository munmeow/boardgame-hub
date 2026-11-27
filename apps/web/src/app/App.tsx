import { useEffect, useState, type MouseEvent } from "react";
import DeepSeaAdventure from "./games/deep-sea-adventure/components/DeepSeaAdventure";
import "./hub.css";

const GAME_ROUTE = "#/games/abyss-relay";

export default function App() {
  const [playing, setPlaying] = useState(() => window.location.hash === GAME_ROUTE);

  useEffect(() => {
    const sync = () => setPlaying(window.location.hash === GAME_ROUTE);
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
    <div className={`bgh-shell ${playing ? "bgh-shell--playing" : ""}`}>
      <header className="bgh-header">
        <a className="bgh-brand" href="#/" onClick={playing ? leaveGame : undefined}>
          <span className="bgh-logo" aria-hidden="true">◆</span>
          <span>Boardgame Hub</span>
        </a>
        {playing ? (
          <a className="bgh-back" href="#/" onClick={leaveGame}>Game library</a>
        ) : (
          <span className="bgh-status">Local preview</span>
        )}
      </header>
      {playing ? (
        <DeepSeaAdventure />
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
                </div>
              </article>
              <article className="bgh-coming">
                <p className="bgh-eyebrow">IN DEVELOPMENT</p>
                <h3>Private rooms</h3>
                <p>Play with friends on separate devices using an invitation code.</p>
                <span className="bgh-status">Not available yet</span>
              </article>
            </div>
          </section>
          <footer className="bgh-footer">Development preview · Online multiplayer is not enabled yet.</footer>
        </main>
      )}
    </div>
  );
}
