import React, { useEffect, useState } from "react";
import { saveGameActivity } from "@/services/gameTracker";


// ---------------- TYPES ----------------
type Level = "easy" | "medium" | "hard";

type Question = {
  question: string;
  options: number[];
  answer: number;
};

// ---------------- QUESTION GENERATOR ----------------
const generateQuestion = (level: Level): Question => {
  let a = 0, b = 0, answer = 0, question = "";

  switch (level) {
    case "easy":
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a + b;
      question = `${a} + ${b}`;
      break;

    case "medium":
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a - b;
      question = `${a} - ${b}`;
      break;

    case "hard":
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      question = `${a} × ${b}`;
      break;
  }

  const options = Array.from(
    new Set([
      answer,
      answer + Math.floor(Math.random() * 5) + 1,
      answer - Math.floor(Math.random() * 5) - 1,
      answer + Math.floor(Math.random() * 10) - 5,
    ])
  )
    .slice(0, 4)
    .sort(() => Math.random() - 0.5);

  return { question, options, answer };
};

// ---------------- COMPONENT ----------------
export default function SpeedMathGame() {
  const [level, setLevel] = useState<Level | null>(null);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [questionNo, setQuestionNo] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);

  // Timer
  useEffect(() => {
    if (!level || gameOver) return;

    if (timeLeft === 0) {
      nextQuestion();
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, level, gameOver]);

  const startGame = (lvl: Level) => {
    setLevel(lvl);
    setScore(0);
    setQuestionNo(1);
    setGameOver(false);
    setTimeLeft(10);
    setCurrentQ(generateQuestion(lvl));
  };

  const nextQuestion = () => {
    if (questionNo === 10) {
      setGameOver(true);
      return;
    }
    setQuestionNo(q => q + 1);
    setTimeLeft(10);
    setCurrentQ(generateQuestion(level!));
  };

  const handleAnswer = (option: number) => {
    if (option === currentQ?.answer) {
      setScore(s => s + 1);
    }
    nextQuestion();
  };
const [startTime, setStartTime] = useState<number>(0);

  // ---------------- LEVEL SELECTION ----------------
  if (!level) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold mb-2">⚡ Speed Math Challenge</h1>
        <p className="text-slate-400 mb-8">
          Answer 10 questions as fast as you can
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <button
            onClick={() => startGame("easy")}
            className="bg-slate-900 border border-slate-800 hover:border-green-400 p-6 rounded-xl transition"
          >
            <h3 className="text-lg font-semibold text-green-400">Easy</h3>
            <p className="text-sm text-slate-400 mt-2">Addition</p>
          </button>

          <button
            onClick={() => startGame("medium")}
            className="bg-slate-900 border border-slate-800 hover:border-yellow-400 p-6 rounded-xl transition"
          >
            <h3 className="text-lg font-semibold text-yellow-400">Medium</h3>
            <p className="text-sm text-slate-400 mt-2">Subtraction</p>
          </button>

          <button
            onClick={() => startGame("hard")}
            className="bg-slate-900 border border-slate-800 hover:border-red-400 p-6 rounded-xl transition"
          >
            <h3 className="text-lg font-semibold text-red-400">Hard</h3>
            <p className="text-sm text-slate-400 mt-2">Multiplication</p>
          </button>
        </div>
      </div>
    );
  }

  // ---------------- GAME OVER ----------------
  if (gameOver) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold mb-2">🏁 Game Over</h2>
        <p className="text-lg text-slate-400 mb-4">
          You scored <span className="text-purple-400 font-bold">{score}</span> / 10
        </p>

        <button
          onClick={() => setLevel(null)}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
        >
          Back to Levels
        </button>
      </div>
    );
  }

  // ---------------- GAME UI ----------------
  return (
    <div className="max-w-md mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
      <div className="flex justify-between text-sm text-slate-400 mb-4">
        <span>Question {questionNo} / 10</span>
        <span>⏱ {timeLeft}s</span>
      </div>

      <div className="w-full h-2 bg-slate-800 rounded mb-6 overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all"
          style={{ width: `${(questionNo / 10) * 100}%` }}
        />
      </div>

      <h2 className="text-4xl font-bold mb-8">
        {currentQ?.question}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {currentQ?.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            className="py-3 rounded-xl bg-slate-800 hover:bg-purple-600 transition text-lg font-semibold"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
