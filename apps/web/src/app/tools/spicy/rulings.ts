export type Challenge = "number" | "flavor";
export type RevealedCard = "standard" | "any-number" | "any-flavor";

export function challengerWins(challenge: Challenge, card: RevealedCard, matches: boolean) {
  if (card === "any-number") return challenge === "flavor";
  if (card === "any-flavor") return challenge === "number";
  return !matches;
}

export type ScoreInput = {
  id: number;
  captured: number;
  trophies: number;
  hand: number;
};

export function calculateResults(players: ScoreInput[]) {
  const scores = players.map(player => ({
    id: player.id,
    total: player.captured + 10 * player.trophies - player.hand,
  }));
  const trophyWinner = players.find(player => player.trophies === 2);
  const topScore = Math.max(...scores.map(score => score.total));
  const winners = trophyWinner
    ? [trophyWinner.id]
    : scores.filter(score => score.total === topScore).map(score => score.id);

  return { scores, winners, byTrophies: Boolean(trophyWinner) };
}
