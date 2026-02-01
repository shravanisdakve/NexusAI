export type GameActivity = {
  game: 'zip' | 'sudoku' | 'interview';
  score?: number;
  duration: number; // seconds
  playedAt: string;
};

export const saveGameActivity = (activity: GameActivity) => {
  const existing =
    JSON.parse(localStorage.getItem('gameActivity') || '[]');

  existing.push(activity);

  localStorage.setItem('gameActivity', JSON.stringify(existing));
};
