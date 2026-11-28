import { useEffect, useRef, useState } from "react";
import { playGameSound, type SoundCue } from "./gameSound";

const STORAGE_KEY = "bgh-sound";
const TONES = {
  roll: [370, 290, 330, 260],
  splash: [220, 170, 115],
  victory: [392, 494, 587, 784],
} satisfies Record<SoundCue, number[]>;

function savedPreference() {
  try { return localStorage.getItem(STORAGE_KEY) === "on"; }
  catch { return false; }
}

export default function GameSoundButton() {
  const [enabled, setEnabled] = useState(savedPreference);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || typeof AudioContext === "undefined") return;
    function unlock() {
      audio.current ??= new AudioContext();
      void audio.current.resume().catch(() => {});
    }
    let previous: SoundCue | undefined;
    let lastPlayed = -Infinity;
    const play = (event: Event) => {
      const context = audio.current;
      const cue = (event as CustomEvent<SoundCue>).detail;
      if (!context || context.state !== "running" || !Object.hasOwn(TONES, cue)) return;
      const start = context.currentTime;
      if (previous === cue && start - lastPlayed < 0.15) return;
      previous = cue;
      lastPlayed = start;
      TONES[cue].forEach((frequency, index) => {
        const time = start + index * (cue === "victory" ? 0.12 : 0.06);
        const note = context.createOscillator();
        const volume = context.createGain();
        note.type = cue === "roll" ? "triangle" : "sine";
        note.frequency.value = frequency;
        volume.gain.setValueAtTime(0.0001, time);
        volume.gain.exponentialRampToValueAtTime(0.055, time + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        note.connect(volume).connect(context.destination);
        note.start(time);
        note.stop(time + 0.22);
      });
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("bgh-game-sound", play);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("bgh-game-sound", play);
      const context = audio.current;
      audio.current = null;
      if (context) void context.close().catch(() => {});
    };
  }, [enabled]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem(STORAGE_KEY, next ? "on" : "off"); } catch { /* Storage unavailable */ }
    if (next && typeof AudioContext !== "undefined") {
      audio.current ??= new AudioContext();
      void audio.current.resume().then(() => playGameSound("splash")).catch(() => {});
    }
  }

  if (typeof AudioContext === "undefined") return null;
  return (
    <button type="button" className="bgh-game-tool" aria-pressed={enabled} onClick={toggle}>
      Sound {enabled ? "on" : "off"}
    </button>
  );
}
