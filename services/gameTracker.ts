import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type GameActivity = {
  game: string;
  score?: number;
  duration: number; // seconds
  playedAt: string;
  level?: number;
};

export const saveGameActivity = async (activity: GameActivity) => {
  try {
    await axios.post(`${API_URL}/api/games/score`, {
      gameId: activity.game,
      score: activity.score || 0,
      duration: activity.duration,
      level: activity.level,
      // playedAt is handled by backend default
    }, {
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error("Error saving game activity:", error);
  }
};

export const getLeaderboard = async (gameId: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/games/leaderboard/${gameId}`, {
      headers: getAuthHeaders()
    });
    if (response.data.success) {
      return response.data.leaderboard;
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
  return [];
};

