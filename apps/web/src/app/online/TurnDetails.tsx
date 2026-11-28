import { useEffect, useState } from 'react';

export type ActionEntry = {
  version: number;
  player: string;
  type: string;
  automated?: boolean;
  total?: number;
  turnBack?: boolean;
};

export function TurnTimer({ milliseconds }: { milliseconds: number }) {
  const [endsAt] = useState(() => performance.now() + milliseconds);
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil(milliseconds / 1000)));

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt - performance.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return <span className="dsa-turn-timer" data-urgent={seconds <= 10} role="timer">{seconds}s left</span>;
}

function describe(entry: ActionEntry) {
  switch (entry.type) {
    case 'AFK': return 'ran out of time. Bot took over';
    case 'START_TURN': return 'started the turn';
    case 'DECLARE_DIRECTION': return entry.turnBack ? 'turned back' : 'kept exploring';
    case 'ROLL_DICE': return `rolled ${entry.total}`;
    case 'PICK_UP_TREASURE': return 'picked up a relic bundle';
    case 'DROP_TREASURE': return 'dropped a relic bundle';
    case 'SKIP_TREASURE': return 'skipped the relic action';
    case 'NEXT_ROUND': return 'started the next dive';
    default: return 'acted';
  }
}

export function ActionLog({ entries, open, onOpenChange }: { entries: ActionEntry[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (entries.length === 0) return null;
  return (
    <details className="dsa-action-log" open={open} onToggle={event => onOpenChange(event.currentTarget.open)}>
      <summary>Action log</summary>
      <ol>
        {entries.slice().reverse().map(entry => (
          <li key={entry.version}>
            <strong>{entry.player}</strong> {describe(entry)}{entry.automated && ' (bot)'}
          </li>
        ))}
      </ol>
    </details>
  );
}
