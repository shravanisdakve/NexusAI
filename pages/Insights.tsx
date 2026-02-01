import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner } from '../components/ui';
import { Clock, Gamepad2, Activity } from 'lucide-react';

// -------------------- TYPES --------------------
interface GameActivity {
  game: 'zip' | 'sudoku' | 'quiz';
  score: number;
  timeSpent: number; // seconds
  date: string;
}

// -------------------- SMALL UI CARDS --------------------
const StatCard = ({ title, value, icon: Icon }: any) => (
  <div className="bg-slate-800/50 p-5 rounded-xl ring-1 ring-slate-700">
    <div className="flex items-center gap-3 text-slate-400 text-sm">
      <Icon size={18} /> {title}
    </div>
    <div className="text-2xl font-bold text-slate-100 mt-2">{value}</div>
  </div>
);

// -------------------- MAIN PAGE --------------------
const Insights: React.FC = () => {
  const [activity, setActivity] = useState<GameActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('gameActivity') || '[]');
    setActivity(data);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  // -------------------- CALCULATIONS --------------------
  const totalPlays = activity.length;

  const totalTime = activity.reduce(
    (sum, item) => sum + item.timeSpent,
    0
  );

  const zipCount = activity.filter(a => a.game === 'zip').length;
  const sudokuCount = activity.filter(a => a.game === 'sudoku').length;
  const quizCount = activity.filter(a => a.game === 'quiz').length;

  let activityLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (totalTime > 300) activityLevel = 'Medium';
  if (totalTime > 900) activityLevel = 'High';

  // -------------------- UI --------------------
  return (
    <div className="space-y-8">
      <PageHeader
        title="Insights"
        subtitle="See how active you are while learning through games"
      />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Games Played"
          value={totalPlays}
          icon={Gamepad2}
        />
        <StatCard
          title="Total Time Spent"
          value={`${totalTime} sec`}
          icon={Clock}
        />
        <StatCard
          title="Activity Level"
          value={activityLevel}
          icon={Activity}
        />
        <StatCard
          title="Zip / Sudoku / Quiz"
          value={`${zipCount} / ${sudokuCount} / ${quizCount}`}
          icon={Gamepad2}
        />
      </div>

      {/* ACTIVITY LIST */}
      <div className="bg-slate-800/50 p-6 rounded-xl ring-1 ring-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Recent Game Activity
        </h3>

        {activity.length === 0 ? (
          <p className="text-slate-400 italic">
            Play a game to start tracking your activity.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {activity
              .slice(-5)
              .reverse()
              .map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between text-slate-300"
                >
                  <span>
                    {item.game.toUpperCase()} — Score {item.score}
                  </span>
                  <span>{item.timeSpent} sec</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Insights;
