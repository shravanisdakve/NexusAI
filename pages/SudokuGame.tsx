
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveGameActivity } from '../services/gameTracker';
import { PageHeader, Button } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, RefreshCw, Trophy, Timer, CheckCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// --- Sudoku Board Logic ---

const BLANK = 0;

const isValidPlacement = (board: number[][], row: number, col: number, num: number): boolean => {
  // Row
  for (let x = 0; x < 9; x++) if (board[row][x] === num) return false;
  // Col
  for (let x = 0; x < 9; x++) if (board[x][col] === num) return false;
  // Box
  const sr = row - (row % 3);
  const sc = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + sr][j + sc] === num) return false;
    }
  }
  return true;
};

const solveSudokuRecursive = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === BLANK) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudokuRecursive(board)) return true;
            board[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const genSudokuBoard = (): number[][] => {
  const board = Array.from({ length: 9 }, () => Array(9).fill(BLANK));
  
  // Quick fill diagonals for randomness
  const fillDigitBox = (b: number[][], r: number, c: number) => {
    let num;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        do { num = Math.floor(Math.random() * 9) + 1; }
        while (!isDigitSafeInBox(b, r, c, num));
        b[r + i][c + j] = num;
      }
    }
  };

  const isDigitSafeInBox = (b: number[][], r: number, c: number, num: number) => {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (b[r + i][c + j] === num) return false;
    return true;
  };

  fillDigitBox(board, 0, 0);
  fillDigitBox(board, 3, 3);
  fillDigitBox(board, 6, 6);
  
  solveSudokuRecursive(board);
  return board;
};

const removeTableDigits = (board: number[][], count: number): number[][] => {
  const newBoard = board.map(row => [...row]);
  let remaining = count;
  while (remaining > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (newBoard[r][c] !== BLANK) {
      newBoard[r][c] = BLANK;
      remaining--;
    }
  }
  return newBoard;
};

// --- Component ---

const SudokuGame: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [solution, setSolution] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<number[][]>([]);
  const [board, setBoard] = useState<number[][]>([]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const startNewGame = useCallback(() => {
    const full = genSudokuBoard();
    const sol = full.map(r => [...r]);
    setSolution(sol);

    const holes = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 55;
    const puzzle = removeTableDigits(full, holes);

    setInitialBoard(puzzle.map(r => [...r]));
    setBoard(puzzle.map(r => [...r]));
    setTimer(0);
    setIsActive(true);
    setIsWon(false);
    setMistakes(0);
    setSelectedCell(null);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isWon) {
      interval = setInterval(() => setTimer(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isWon]);

  const handleCellChange = (r: number, c: number, val: string) => {
    if (!isActive || isWon || initialBoard[r][c] !== BLANK) return;

    if (val === '') {
      const nb = board.map(row => [...row]);
      nb[r][c] = 0;
      setBoard(nb);
      return;
    }

    const num = parseInt(val);
    if (isNaN(num) || num < 1 || num > 9) return;

    const nb = board.map(row => [...row]);
    nb[r][c] = num;
    setBoard(nb);

    if (num !== solution[r][c]) {
      setMistakes(p => p + 1);
    }
  };

  const checkSolutionAction = async () => {
    // Basic completion check
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === BLANK) {
                showToast(t('sudoku.fillBoardFirst') || "Please complete the board first.", 'error');
                return;
            }
        }
    }

    let isCorrect = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] !== solution[i][j]) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      setIsWon(true);
      setIsActive(false);
      showToast("Trophy Unlocked! Your score has been synced.", 'success');
      
      const scoreBase = difficulty === 'Easy' ? 1000 : difficulty === 'Medium' ? 2000 : 3000;
      const score = Math.max(0, scoreBase - timer - (mistakes * 50));

      try {
        await saveGameActivity({
            game: 'sudoku',
            score,
            duration: timer,
            playedAt: new Date().toISOString(),
            level: difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3
        });
      } catch (err) {
        console.error("Failed to sync score:", err);
      }
    } else {
      showToast(t('sudoku.incorrectSolution') || "Board is incorrect. Review your numbers.", 'error');
    }
  };

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss < 10 ? '0' : ''}${ss}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="w-full max-w-5xl px-6 py-10 mx-auto">
        <div className="flex items-center gap-6 mb-12">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-500 hover:text-white">
            <ArrowLeft size={24} />
          </Button>
          <PageHeader title={t('sudoku.title')} subtitle={t('sudoku.subtitle')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Game Info Panel */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3 text-violet-400">
                  <Timer size={24} />
                  <span className="text-3xl font-mono font-black tracking-tighter">{formatSecs(timer)}</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl text-rose-400">
                  <span className="text-xs font-black uppercase tracking-widest mr-2 opacity-60">Mistakes</span>
                  <span className="font-mono font-bold text-lg">{mistakes}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Select Intensity</p>
                  <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                    {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${difficulty === d ? 'bg-violet-600 shadow-lg shadow-violet-600/20 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={startNewGame} variant="outline" className="w-full h-14 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl">
                   <RotateCcw size={18} className="mr-3" /> New Sequence
                </Button>
              </div>
            </div>

            {isWon && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-10 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy size={40} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black mb-2">Structure Solved</h3>
                <p className="text-emerald-400/70 text-sm mb-8">Performance data synced to NexusAI cloud profile.</p>
                <Button onClick={startNewGame} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold h-12 shadow-lg shadow-emerald-600/20">
                  Initialize Next.exe
                </Button>
              </div>
            )}
          </div>

          {/* Grid Container */}
          <div className="lg:col-span-8 flex flex-col items-center">
             <div className="p-1 bg-slate-900 rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 relative">
                <div className="grid grid-cols-9 gap-1 sm:gap-1.5 bg-slate-800 p-2 sm:p-4 rounded-[1.8rem]">
                    {board.map((row, r) => (
                        row.map((cell, c) => {
                            const isInitial = initialBoard[r][c] !== BLANK;
                            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                            const isBoxBottom = (r + 1) % 3 === 0 && r !== 8;
                            const isBoxRight = (c + 1) % 3 === 0 && c !== 8;

                            return (
                                <input
                                    key={`cell-${r}-${c}`}
                                    type="text"
                                    maxLength={1}
                                    value={cell === BLANK ? '' : cell}
                                    disabled={isInitial || isWon}
                                    onClick={() => setSelectedCell([r, c])}
                                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                                    className={`
                                        w-9 h-9 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-black outline-none transition-all duration-200
                                        caret-transparent cursor-pointer rounded-lg sm:rounded-xl
                                        ${isInitial ? 'bg-slate-900/60 text-slate-500 border border-transparent' : 'bg-slate-950 text-indigo-400 border border-white/5 hover:border-violet-500/30'}
                                        ${isSelected ? 'bg-violet-600/20 !ring-2 ring-violet-500 border-transparent shadow-[0_0_20px_rgba(139,92,246,0.3)] z-10' : ''}
                                        ${isBoxRight ? 'mr-1 sm:mr-2' : ''} ${isBoxBottom ? 'mb-1 sm:mb-2' : ''}
                                    `}
                                    inputMode="numeric"
                                />
                            );
                        })
                    ))}
                </div>
             </div>

             {!isWon && (
                <div className="mt-12 w-full max-w-sm">
                    <Button onClick={checkSolutionAction} className="w-full h-16 rounded-2xl text-lg font-black bg-gradient-to-r from-violet-600 to-indigo-600 shadow-2xl shadow-violet-600/20 hover:scale-[1.02] active:scale-95">
                        <CheckCircle size={22} className="mr-3" /> Validate Solution
                    </Button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SudokuGame;
