import { useEffect, useRef, useState } from "react";

export default function FullscreenButton() {
  const button = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const shell = button.current?.closest<HTMLElement>(".bgh-shell");
    if (!shell) return;
    const sync = () => setActive(document.fullscreenElement === shell || shell.hasAttribute("data-board-focus"));
    function leaveFocus(event: KeyboardEvent) {
      if (event.key !== "Escape" || !shell?.hasAttribute("data-board-focus")) return;
      shell.removeAttribute("data-board-focus");
      sync();
    }
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("keydown", leaveFocus);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("keydown", leaveFocus);
      shell.removeAttribute("data-board-focus");
      if (document.fullscreenElement === shell) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  async function toggle() {
    const shell = button.current?.closest<HTMLElement>(".bgh-shell");
    if (!shell) return;
    if (document.fullscreenElement === shell) {
      await document.exitFullscreen();
      return;
    }
    if (shell.hasAttribute("data-board-focus")) {
      shell.removeAttribute("data-board-focus");
      setActive(false);
      return;
    }
    if (document.fullscreenEnabled && shell.requestFullscreen) {
      try {
        await shell.requestFullscreen();
        return;
      } catch {
        // The board can still fill the viewport when browser fullscreen is unavailable.
      }
    }
    shell.setAttribute("data-board-focus", "");
    setActive(true);
  }

  return (
    <button ref={button} type="button" className="bgh-fullscreen" aria-pressed={active} onClick={() => void toggle()}>
      {active ? "Exit fullscreen" : "Fullscreen"}
    </button>
  );
}
