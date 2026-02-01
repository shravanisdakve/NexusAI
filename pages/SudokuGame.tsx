import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveGameActivity } from '@/services/gameTracker';


const initialBoard = [
  [1, 0, 0, 4, 0, 6],
  [0, 5, 6, 0, 2, 0],

  [0, 0, 1, 0, 6, 4],
  [4, 6, 0, 0, 0, 1],

  [0, 1, 0, 6, 4, 0],
  [6, 0, 4, 0, 0, 2],
];

const solution = [
  [1, 2, 3, 4, 5, 6],
  [3, 5, 6, 1, 2, 4],
  [2, 3, 1, 5, 6, 4],
  [4, 6, 5, 2, 3, 1],
  [5, 1, 2, 6, 4, 3],
  [6, 4, 3, 3, 1, 2],
];

const SudokuGame: React.FC = () => {
  const [board, setBoard] = useState(initialBoard);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (r: number, c: number, val: string) => {
    if (initialBoard[r][c] !== 0) return;
    if (!/^[1-6]?$/.test(val)) return;

    const updated = board.map(row => [...row]);
    updated[r][c] = val === '' ? 0 : Number(val);
    setBoard(updated);
  };

  const checkSolution = () => {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (board[r][c] !== solution[r][c]) {
          setMessage('❌ Some values are incorrect');
          return;
        }
      }
    }
    setMessage('✅ Sudoku Solved Correctly!');
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-1">Sudoku 6×6</h1>
      <p className="text-gray-400 mb-6">Fill numbers from 1 to 6</p>

      <div className="grid grid-cols-6 gap-1">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <input
              key={`${r}-${c}`}
              value={cell === 0 ? '' : cell}
              onChange={e => handleChange(r, c, e.target.value)}
              disabled={initialBoard[r][c] !== 0}
              className={`w-14 h-14 text-center text-lg font-bold
                border border-slate-600 bg-slate-900 text-purple-400
                ${(r % 2 === 0 && r !== 0) ? 'border-t-4' : ''}
                ${(c % 3 === 0 && c !== 0) ? 'border-l-4' : ''}
                ${initialBoard[r][c] !== 0 ? 'bg-slate-800 text-white' : ''}`}
            />
          ))
        )}
      </div>

      <button
        onClick={checkSolution}
        className="mt-6 px-6 py-2 rounded bg-purple-600 hover:bg-purple-700"
      >
        Check Solution
      </button>

      {message && <p className="mt-3">{message}</p>}

      <button
        onClick={() => navigate('/')}
        className="mt-4 text-sm text-gray-400 hover:underline"
      >
        ← Back to Home
      </button>
    </div>
  );
};

export default SudokuGame;