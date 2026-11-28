const EMOJI = [
  { symbol: '👏', label: 'Applause' },
  { symbol: '😮', label: 'Surprised' },
  { symbol: '😂', label: 'Laugh' },
  { symbol: '🫧', label: 'Bubbles' },
  { symbol: '⚓', label: 'Anchor' },
];

export type Reaction = { code: string; name: string; emoji: string };

export default function RoomReactions({ reaction, disabled, onReact }: {
  reaction: Reaction | null;
  disabled: boolean;
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="dsa-reactions">
      <div className="dsa-reaction-buttons" role="group" aria-label="Send a reaction">
        {EMOJI.map(({ symbol, label }) => (
          <button type="button" key={symbol} aria-label={label} disabled={disabled} onClick={() => onReact(symbol)}>
            {symbol}
          </button>
        ))}
      </div>
      <div className="dsa-reaction-live" role="status" aria-atomic="true">
        {reaction && <span>{reaction.name} {reaction.emoji}</span>}
      </div>
    </div>
  );
}
