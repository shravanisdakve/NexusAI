import React, { useState } from 'react';
import { PageHeader } from '../components/ui';
import { Brain, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveGameActivity } from '@/services/gameTracker';

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
};

type WrongAnswer = {
  question: string;
  selected: string;
  correct: string;
};

const questions: Question[] = [
  {
    question: 'What is the output pattern?\n*\n* *\n* * *',
    options: ['Square', 'Triangle', 'Rectangle', 'Pyramid'],
    correctIndex: 1,
  },
  {
    question: 'Which loop is best for known number of iterations?',
    options: ['while', 'do-while', 'for', 'foreach'],
    correctIndex: 2,
  },
  {
    question: 'What does reversing an array mean?',
    options: [
      'Sorting array',
      'Printing last element',
      'Changing order of elements',
      'Deleting elements',
    ],
    correctIndex: 2,
  },
  {
    question: 'What is the time complexity of linear search?',
    options: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'],
    correctIndex: 1,
  },
  {
    question: 'Which data structure uses LIFO?',
    options: ['Queue', 'Array', 'Stack', 'Linked List'],
    correctIndex: 2,
  },
];

const InterviewQuiz: React.FC = () => {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);

  const handleNext = () => {
    const q = questions[current];

    if (selected === q.correctIndex) {
      setScore(prev => prev + 1);
    } else if (selected !== null) {
      setWrongAnswers(prev => [
        ...prev,
        {
          question: q.question,
          selected: q.options[selected],
          correct: q.options[q.correctIndex],
        },
      ]);
    }

    setSelected(null);

    if (current + 1 < questions.length) {
      setCurrent(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-6 bg-slate-900 rounded-xl">
      <Brain size={42} className="text-rose-400 mx-auto mb-4" />

      <PageHeader
        title="Interview Logic Quiz"
        subtitle="Practice patterns, loops, arrays & logic"
      />

      {!finished ? (
        <>
          <h2 className="text-lg font-semibold mb-4 whitespace-pre-line">
            {current + 1}. {questions[current].question}
          </h2>

          <div className="space-y-3">
            {questions[current].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={`w-full p-2 rounded border text-left ${
                  selected === idx
                    ? 'bg-purple-600 border-purple-400'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={selected === null}
            className="mt-5 w-full bg-purple-600 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </>
      ) : (
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-center">Quiz Completed 🎉</h2>
          <p className="text-center mt-2">
            Score: {score} / {questions.length}
          </p>

          {/* Wrong Answers Section */}
          {wrongAnswers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-red-400">
                Review Wrong Answers
              </h3>

              <div className="space-y-4">
                {wrongAnswers.map((wa, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800 p-4 rounded border border-slate-700"
                  >
                    <p className="font-medium whitespace-pre-line">
                      {wa.question}
                    </p>
                    <p className="text-red-400 mt-2">
                      Your answer: {wa.selected}
                    </p>
                    <p className="text-green-400">
                      Correct answer: {wa.correct}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back to Home */}
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-purple-600 py-2 rounded"
          >
            <Home size={18} />
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewQuiz;
