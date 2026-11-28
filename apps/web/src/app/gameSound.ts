export type SoundCue = "roll" | "splash" | "victory";

export function playGameSound(cue: SoundCue) {
  window.dispatchEvent(new CustomEvent<SoundCue>("bgh-game-sound", { detail: cue }));
}
