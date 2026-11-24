
interface Props {
  oxygen: number;
}

export default function OxygenMeter({
  oxygen,
}: Props) {
  const percentage = Math.max(
    0,
    Math.min(100, (oxygen / 25) * 100),
  );

  const color =
    oxygen <= 5
      ? "#ef4444"
      : oxygen <= 12
        ? "#f59e0b"
        : "#22d3ee";

  return (
    <section className="dsa-panel">
      <span>OXYGEN</span>

      <h2>{Math.max(0, oxygen)} / 25</h2>

      <div className="dsa-oxygen-track">
        <div
          className="dsa-oxygen-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {oxygen <= 0 && (
        <p>Final turn!</p>
      )}
    </section>
  );
}
