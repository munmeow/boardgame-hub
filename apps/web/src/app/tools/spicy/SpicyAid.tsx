import { useState } from "react";
import { calculateResults, challengerWins, type Challenge, type RevealedCard, type ScoreInput } from "./rulings";
import "./spicy-aid.css";

function ChallengePanel() {
  const [challenge, setChallenge] = useState<Challenge>("number");
  const [card, setCard] = useState<RevealedCard>("standard");
  const [matches, setMatches] = useState<boolean | null>(null);
  const result = card === "standard" && matches === null
    ? null
    : challengerWins(challenge, card, matches === true);
  const winner = result ? "Người thách thức" : "Người đánh lá bài";
  const loser = result ? "Người đánh lá bài" : "Người thách thức";

  return (
    <section className="spicy-panel" aria-labelledby="spicy-challenge">
      <h2 id="spicy-challenge">Xử lý thách thức</h2>
      <p>Chốt yếu tố bị thách thức trước khi lật lá trên cùng. Sau khi lật, nhập kết quả tại đây.</p>
      <div className="spicy-fields">
        <label>Thách thức
          <select value={challenge} onChange={event => {
            setChallenge(event.target.value === "flavor" ? "flavor" : "number");
            setMatches(null);
          }}>
            <option value="number">Sai số</option>
            <option value="flavor">Sai vị</option>
          </select>
        </label>
        <label>Lá vừa lật
          <select value={card} onChange={event => {
            const value = event.target.value;
            setCard(value === "any-number" || value === "any-flavor" ? value : "standard");
            setMatches(null);
          }}>
            <option value="standard">Lá có số và vị</option>
            <option value="any-number">Số Bất Kỳ</option>
            <option value="any-flavor">Vị Bất Kỳ</option>
          </select>
        </label>
        {card === "standard" && (
          <label>{challenge === "number" ? "Số" : "Vị"} trên lá có khớp lời tuyên bố?
            <select value={matches === null ? "" : String(matches)} onChange={event => {
              setMatches(event.target.value === "" ? null : event.target.value === "true");
            }}>
              <option value="">Chọn kết quả</option>
              <option value="true">Có, trùng khớp</option>
              <option value="false">Không, khác lời tuyên bố</option>
            </select>
          </label>
        )}
      </div>
      <div aria-live="polite">
        {result !== null && (
          <div className="spicy-result">
            <p><strong>{winner}</strong> lấy cả chồng bài. Mỗi lá thu được tính 1 điểm cuối ván.</p>
            <p><strong>{loser}</strong> rút 2 lá rồi mở chồng mới. Dừng rút ngay nếu lá Tận Thế xuất hiện.</p>
          </div>
        )}
      </div>
      <p className="spicy-example"><strong>Ví dụ:</strong> Tuyên bố 9 Tiêu và lật 7 Tiêu. Bắt sai số thì người thách thức thắng. Bắt sai vị thì người đánh thắng.</p>
    </section>
  );
}

type ScoreField = Exclude<keyof ScoreInput, "id">;
type PlayerRow = { id: number; name: string; captured: string; trophies: string; hand: string };
const SCORE_FIELDS: { key: ScoreField; label: string; max: number }[] = [
  { key: "captured", label: "Lá thu được", max: 100 },
  { key: "trophies", label: "Chiến Tích", max: 2 },
  { key: "hand", label: "Lá trên tay", max: 100 },
];
const newPlayer = (id: number): PlayerRow => ({ id, name: "", captured: "", trophies: "", hand: "" });

function ScorePanel() {
  const [players, setPlayers] = useState(() => [newPlayer(1), newPlayer(2)]);
  const [submitted, setSubmitted] = useState(false);
  const tally = players.map(({ id, captured, trophies, hand }) => ({
    id, captured: Number(captured), trophies: Number(trophies), hand: Number(hand),
  }));
  const trophyCount = tally.reduce((total, player) => total + player.trophies, 0);
  const valid = tally.every(player => SCORE_FIELDS.every(({ key, max }) =>
    Number.isInteger(player[key]) && player[key] >= 0 && player[key] <= max,
  ));
  const result = submitted && valid && trophyCount <= 3 ? calculateResults(tally) : null;
  const nameOf = (player: PlayerRow, index: number) => player.name.trim() || `Người chơi ${index + 1}`;
  const winners = players.flatMap((player, index) => result?.winners.includes(player.id) ? [nameOf(player, index)] : []);

  function update(id: number, field: ScoreField | "name", value: string) {
    setSubmitted(false);
    setPlayers(current => current.map(player => player.id === id ? { ...player, [field]: value } : player));
  }

  return (
    <section className="spicy-panel spicy-score" aria-labelledby="spicy-score">
      <h2 id="spicy-score">Tính điểm cuối ván</h2>
      <p>Điểm = lá thu được + 10 × Chiến Tích − lá trên tay. Người có 2 Chiến Tích thắng ngay.</p>
      <form onSubmit={event => { event.preventDefault(); setSubmitted(true); }}>
        <div className="spicy-player-grid">
          {players.map((player, index) => (
            <fieldset key={player.id}>
              <legend>Người chơi {index + 1}</legend>
              <label>Tên
                <input value={player.name} maxLength={24} placeholder={`Người chơi ${index + 1}`} onChange={event => update(player.id, "name", event.target.value)} />
              </label>
              {SCORE_FIELDS.map(({ key, label, max }) => (
                <label key={key}>{label}
                  <input type="number" inputMode="numeric" min="0" max={max} step="1" placeholder="0"
                    value={player[key]} onChange={event => update(player.id, key, event.target.value)} />
                </label>
              ))}
              {players.length > 2 && <button className="spicy-button" type="button" onClick={() => {
                setPlayers(current => current.filter(row => row.id !== player.id));
                setSubmitted(false);
              }}>Xóa người chơi {index + 1}</button>}
            </fieldset>
          ))}
        </div>
        <div className="spicy-score-actions">
          <button className="spicy-button" type="button" disabled={players.length >= 6} onClick={() => {
            setPlayers(current => [...current, newPlayer(Math.max(...current.map(player => player.id)) + 1)]);
            setSubmitted(false);
          }}>Thêm người chơi</button>
          <button className="spicy-button spicy-button-primary" type="submit">Tính điểm</button>
        </div>
      </form>
      <div aria-live="polite">
        {submitted && trophyCount > 3 && <p className="spicy-error">Cả bàn có tối đa 3 Chiến Tích.</p>}
        {result && (
          <div className="spicy-result">
            <p><strong>{winners.join(", ")}</strong> {winners.length > 1 ? "đồng thắng" : "thắng"}{result.byTrophies ? " nhờ có 2 Chiến Tích" : ""}.</p>
            {!result.byTrophies && <ul>{result.scores.map((score, index) => (
              <li key={score.id}>{nameOf(players[index], index)} <strong>{score.total} điểm</strong></li>
            ))}</ul>}
          </div>
        )}
      </div>
    </section>
  );
}

export default function SpicyAid() {
  return (
    <main className="spicy-aid" lang="vi">
      <header className="spicy-heading">
        <a className="bgh-back" href="#/">← Về thư viện</a>
        <h1>Hỗ trợ chơi Spicy</h1>
        <p>Tra luật lượt đánh, xử lý thách thức và tính điểm khi chơi bằng bộ bài thật.</p>
      </header>
      <div className="spicy-grid">
        <section className="spicy-panel" aria-labelledby="spicy-turn">
          <h2 id="spicy-turn">Tra lượt đánh</h2>
          <ol className="spicy-rules">
            <li><strong>Mở chồng:</strong> Đánh úp một lá và tuyên bố số 1, 2 hoặc 3 cùng một vị bất kỳ.</li>
            <li><strong>Đánh tiếp:</strong> Tuyên bố cùng vị và số lớn hơn. Sau số 10, tuyên bố lại 1, 2 hoặc 3 với cùng vị.</li>
            <li><strong>Bỏ lượt:</strong> Rút 1 lá. Lá trên cùng vẫn có thể bị thách thức.</li>
            <li><strong>Tuyên bố không hợp lệ:</strong> Lấy lại lá vừa đánh, rồi bỏ lượt và rút 1 lá.</li>
            <li><strong>Đánh lá cuối:</strong> Báo ngay và chờ mọi người quyết định có thách thức hay không. Nếu quên báo, lấy lại lá vừa đánh và rút 1 lá.</li>
            <li><strong>Lấy Chiến Tích:</strong> Nếu lá cuối qua được thách thức hoặc bạn thắng khi bị thách thức, nhận 1 Chiến Tích. Nếu ván vẫn tiếp tục, rút lại 6 lá.</li>
            <li><strong>Kết thúc:</strong> Dừng ngay khi có người đạt 2 Chiến Tích, khi Chiến Tích thứ ba được lấy hoặc khi lá Tận Thế nằm trên cùng chồng rút.</li>
          </ol>
        </section>
        <ChallengePanel />
        <ScorePanel />
      </div>
    </main>
  );
}
