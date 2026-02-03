import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveGameActivity } from '../services/gameTracker';
import { PageHeader, Button } from '../components/ui';
import { ArrowLeft, RefreshCw, Trophy, Timer, CheckCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// --- Sudoku Logic ---

const BLANK = 0;

const isValid = (board: number[][], row: number, col: number, num: number) => {
  // Check row
  for (let x = 0; x < 9; x++) if (board[row][x] === num) return false;
  // Check col
  for (let x = 0; x < 9; x++) if (board[x][col] === num) return false;
  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
};

const solveSudoku = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === BLANK) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generateBoard = (): number[][] => {
  const board = Array.from({ length: 9 }, () => Array(9).fill(BLANK));

  // Fill diagonal 3x3 boxes first (independent)
  for (let i = 0; i < 9; i = i + 3) {
    fillBox(board, i, i);
  }
  // Solve the rest
  solveSudoku(board);
  return board;
};

const fillBox = (board: number[][], row: number, col: number) => {
  let num: number;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeInBox(board, row, col, num));
      board[row + i][col + j] = num;
    }
  }
};

const isSafeInBox = (board: number[][], rowStart: number, colStart: number, num: number) => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
};

const removeDigits = (board: number[][], count: number): number[][] => {
  const newBoard = board.map(row => [...row]);
  let attempts = count;
  while (attempts > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (newBoard[row][col] !== BLANK) {
      newBoard[row][col] = BLANK;
      attempts--;
    }
  }
  return newBoard;
};

// --- Component ---

const SudokuGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Game State
  const [solution, setSolution] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);

  // Initial Load
  useEffect(() => {
    startNewGame();
  }, []); // Run once on mount

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isWon) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isWon]);

  const startNewGame = useCallback(() => {
    const fullBoard = generateBoard();
    // Deep copy for solution
    const solutionBoard = fullBoard.map(row => [...row]);
    setSolution(solutionBoard);

    // Determine holes based on difficulty
    const holes = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 55;
    const puzzle = removeDigits(fullBoard, holes);

    setInitialBoard(puzzle.map(row => [...row]));
    setBoard(puzzle.map(row => [...row]));
    setTimer(0);
    setIsActive(true);
    setIsWon(false);
    setMistakes(0);
    setSelectedCell(null);
  }, [difficulty]);

  const handleCellChange = (row: number, col: number, value: string) => {
    if (!isActive || isWon) return;
    if (initialBoard[row][col] !== BLANK) return;

    // Allow clearing cell
    if (value === '') {
      const newBoard = updateBoard(row, col, 0);
      setBoard(newBoard);
      return;
    }

    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 9) return;

    const newBoard = updateBoard(row, col, num);
    setBoard(newBoard);

    // Instant validation for mistakes (Optional, but good for UX)
    if (num !== solution[row][col]) {
      setMistakes(prev => prev + 1);
    }
  };

  const updateBoard = (row: number, col: number, val: number) => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = val;
    return newBoard;
  };

  const checkSolution = async () => {
    // Check if full
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === BLANK) {
          alert('Please fill the whole board first!');
          return;
        }
      }
    }

    // Validate
    let correct = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] !== solution[i][j]) {
          correct = false;
          break;
        }
      }
    }

    if (correct) {
      setIsWon(true);
      setIsActive(false);

      // Calculate Score based on time and difficulty
      // Base: Easy=1000, Med=2000, Hard=3000
      // Time Penalty: -1 per second
      // Mistake Penalty: -50 per mistake
      const baseScore = difficulty === 'Easy' ? 1000 : difficulty === 'Medium' ? 2000 : 3000;
      const finalScore = Math.max(0, baseScore - timer - (mistakes * 50));

      await saveGameActivity({
        game: 'sudoku',
        score: finalScore,
        duration: timer,
        playedAt: new Date().toISOString(),
        level: difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3
      });
    } else {
      alert("Incorrect Solution! Keep trying.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mr-4 text-slate-400">
            <ArrowLeft size={20} />
          </Button>
          <PageHeader title="Sudoku Challenge" subtitle="Focus your mind with the classic numbers game." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar / Controls */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-violet-400">
                  <Timer size={22} />
                  <span className="text-2xl font-mono font-bold">{formatTime(timer)}</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400">
                  <span className="text-sm font-bold uppercase tracking-wider">Mistakes</span>
                  <span className="font-mono font-bold bg-rose-500/10 px-2 py-1 rounded">{mistakes}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Difficulty</label>
                  <div className="flex bg-slate-900/50 p-1 rounded-lg">
                    {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => { setDifficulty(d); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${difficulty === d ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={startNewGame} variant="outline" className="w-full border-slate-600 hover:bg-slate-700">
                  <RotateCcw size={16} className="mr-2" /> New Game
                </Button>
              </div>
            </div>

            {isWon && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center animate-in zoom-in duration-300">
                <Trophy size={48} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Puzzle Solved!</h3>
                <p className="text-emerald-200 mb-4">Great mental exercise. Your progress has been saved.</p>
                <Button onClick={startNewGame} className="bg-emerald-600 hover:bg-emerald-500">
                  Play Again
                </Button>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="relative p-1 bg-slate-900 rounded-lg shadow-2xl ring-4 ring-slate-800">
              <div className="grid grid-cols-9 gap-[1px] bg-slate-700 border-2 border-slate-700">
                {board.map((row, r) => (
                  row.map((cell, c) => {
                    const isInitial = initialBoard[r][c] !== BLANK;
                    const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                    // Thick borders for 3x3 grids
                    const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-slate-500' : '';
                    const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-slate-500' : '';

                    return (
                      <input
                        key={`${r}-${c}`}
                        type="text"
                        maxLength={1}
                        value={cell === BLANK ? '' : cell}
                        disabled={isInitial || isWon}
                        onClick={() => setSelectedCell([r, c])}
                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                        className={`
                                                    w-9 h-9 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold outline-none transition-colors
                                                    caret-transparent cursor-pointer
                                                    ${isInitial
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-900 text-violet-300 hover:bg-slate-800/80 focus:bg-violet-900/30'}
                                                    ${isSelected ? 'bg-violet-600/20 !ring-2 ring-inset ring-violet-500 z-10' : ''}
                                                    ${borderRight} ${borderBottom}
                                                `}
                        inputMode="numeric"
                      />
                    );
                  })
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Validate Button (Mobile/Desktop) */}
        {!isWon && (
          <div className="mt-8 flex justify-center">
            <Button onClick={checkSolution} className="px-12 py-4 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-900/20 hover:scale-105 transition-transform">
              <CheckCircle size={24} className="mr-2" /> Submit Solution
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SudokuGame;
