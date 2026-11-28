import { useState } from "react";
import "./card-playtest.css";

const declaredCard = "9 Tiêu";
const actualCard = "7 Tiêu";
type Stage = "choose" | "selected" | "respond" | "number" | "flavor" | "passed";

export default function CardPlaytest() {
  const [stage, setStage] = useState<Stage>("choose");
  const choosing = stage === "choose" || stage === "selected";
  const revealed = stage === "number" || stage === "flavor";

  return (
    <main className="playtest" lang="vi">
      <header className="playtest-header">
        <a className="bgh-back" href="#/">← Về thư viện</a>
        <h1>Bàn chơi thử</h1>
        <p>Thử một tình huống mẫu. Đánh úp một lá, tuyên bố số và vị, rồi đổi góc nhìn để chọn cách thách thức.</p>
      </header>
      <div className="playtest-layout">
        <section className="playtest-table" aria-labelledby="playtest-table-heading">
          <h2 id="playtest-table-heading">Trên bàn</h2>
          <div className="playtest-card" data-face={revealed ? "front" : "back"}>
            {revealed ? actualCard : choosing ? "Chưa đánh" : "Bài úp"}
          </div>
          {!choosing && <p>Tuyên bố <strong>{declaredCard}</strong></p>}
        </section>
        <section className="playtest-controls" aria-labelledby="playtest-controls-heading">
          {choosing && (
            <>
              <h2 id="playtest-controls-heading">Tay bài mẫu</h2>
              <button className="playtest-card" data-face="front" type="button"
                aria-pressed={stage === "selected"}
                onClick={() => setStage(stage === "selected" ? "choose" : "selected")}>
                {actualCard}
              </button>
              <p className="playtest-claim">Tuyên bố mẫu <strong>{declaredCard}</strong></p>
              <button className="playtest-primary" type="button" disabled={stage !== "selected"}
                onClick={() => setStage("respond")}>Đánh úp và tuyên bố</button>
            </>
          )}
          {stage === "respond" && (
            <>
              <h2 id="playtest-controls-heading">Góc nhìn của đối thủ</h2>
              <p>Người đánh vừa tuyên bố <strong>{declaredCard}</strong>. Chọn yếu tố bạn muốn thách thức trước khi lật lá.</p>
              <div className="playtest-actions">
                <button type="button" onClick={() => setStage("number")}>Sai số</button>
                <button type="button" onClick={() => setStage("flavor")}>Sai vị</button>
                <button type="button" onClick={() => setStage("passed")}>Cho qua</button>
              </div>
            </>
          )}
          {(revealed || stage === "passed") && (
            <>
              <h2 id="playtest-controls-heading">Kết quả</h2>
              <div role="status" className="playtest-result">
                {stage === "passed" ? (
                  <p>Đối thủ cho qua. Lá vẫn úp.</p>
                ) : stage === "number" ? (
                  <p><strong>Người thách thức thắng.</strong> Số thật là 7, khác số 9 đã tuyên bố.</p>
                ) : (
                  <p><strong>Người đánh thắng.</strong> Vị thật là Tiêu, trùng với vị đã tuyên bố. Lần này chỉ xét vị.</p>
                )}
              </div>
              <button type="button" onClick={() => setStage("choose")}>Thử lại</button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
