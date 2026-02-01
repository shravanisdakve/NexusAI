import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { saveGameActivity } from '@/services/gameTracker';

const LETTERS = ['A', 'S', 'D', 'F', 'J', 'K', 'L'];

const ZipGame: React.FC = () => {
  const navigate = useNavigate();

  const [currentKey, setCurrentKey] = useState('A');
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // ⏱ track start time
  const startTimeRef = useRef<number>(Date.now());

  const randomKey = () =>
    LETTERS[Math.floor(Math.random() * LETTERS.length)];

  /* Falling bar logic */
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setPosition((p) => {
        if (p >= 90) {
          endGame();
          return p;
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver]);

  /* Key press logic */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;

      if (e.key.toUpperCase() === currentKey) {
        setScore((s) => s + 1);
        setPosition(0);
        setCurrentKey(randomKey());
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentKey, gameOver]);

  /* Save activity when game ends */
  const endGame = () => {
    setGameOver(true);

    const durationInSeconds = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );

    saveGameActivity({
      game: 'zip',
      score,
      duration: durationInSeconds,
      playedAt: new Date().toISOString(),
    });
  };

  const resetGame = () => {
    setScore(0);
    setPosition(0);
    setCurrentKey(randomKey());
    setGameOver(false);
    startTimeRef.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <PageHeader
        title="Zip Game"
        subtitle="Press the correct key before the bar reaches the bottom"
      />

      <div className="w-24 h-80 bg-slate-800 rounded-xl relative overflow-hidden border border-slate-700">
        <div
          className="absolute w-full bg-purple-500 text-white font-bold flex items-center justify-center"
          style={{ top: `${position}%`, height: '40px' }}
        >
          {currentKey}
        </div>
      </div>

      <div className="text-lg">
        Score:{' '}
        <span className="text-purple-400 font-bold">{score}</span>
      </div>

      {gameOver && (
        <div>
          <p className="text-red-400 mb-3">Game Over!</p>
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Restart
          </button>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="text-sm text-slate-400 hover:text-white"
      >
        Back to Home
      </button>
    </div>
  );
};

export default ZipGame;
