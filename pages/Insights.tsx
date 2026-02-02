import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner } from '../components/ui';
import { Clock, Gamepad2, Activity, Zap, Brain, Target, ShieldAlert } from 'lucide-react';
import { getProductivityReport } from '../services/analyticsService';
import KnowledgeMap from '../components/KnowledgeMap';

// -------------------- TYPES --------------------
interface ProductivityData {
  totalStudyTime: number;
  quizAccuracy: number;
  totalQuizzes: number;
  correctQuizzes: number;
  strengths: { topic: string; accuracy: number; count: number }[];
  weaknesses: { topic: string; accuracy: number; count: number }[];
  completedPomodoros: number;
}

// -------------------- SMALL UI CARDS --------------------
const StatCard = ({ title, value, icon: Icon, colorClass = 'text-slate-400' }: any) => (
  <div className="bg-slate-800/50 p-5 rounded-2xl ring-1 ring-slate-700 hover:ring-violet-500/50 transition-all duration-300 shadow-lg">
    <div className="flex items-center gap-3 text-slate-400 text-sm">
      <Icon size={18} className={colorClass} /> {title}
    </div>
    <div className="text-2xl font-black text-slate-100 mt-2">{value}</div>
  </div>
);

// Helper function to format time
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0 sec';
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

const Insights: React.FC = () => {
  const [report, setReport] = useState<ProductivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const data = await getProductivityReport();
      setReport(data as any);
      setLoading(false);
    };
    fetchReport();
  }, []);

  if (loading || !report) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  // Prepare map data
  const mapData = [...report.strengths, ...report.weaknesses].map(t => ({
    name: t.topic,
    strength: t.accuracy / 100
  }));

  // If no data, show placeholder topics for demo
  const finalMapData = mapData.length > 0 ? mapData : [
    { name: 'Linked Lists', strength: 0.85 },
    { name: 'Trees', strength: 0.45 },
    { name: 'Recursion', strength: 0.92 },
    { name: 'Dynamic Programming', strength: 0.30 },
    { name: 'Greedy Algorithms', strength: 0.65 }
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Academic Insights"
        subtitle="Deep analysis of your learning patterns and performance."
      />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Study Time (Weekly)"
          value={formatTime(report.totalStudyTime)}
          icon={Clock}
          colorClass="text-sky-400"
        />
        <StatCard
          title="Quiz Accuracy"
          value={`${report.quizAccuracy}%`}
          icon={Brain}
          colorClass="text-rose-400"
        />
        <StatCard
          title="Completed Pomodoros"
          value={report.completedPomodoros}
          icon={Zap}
          colorClass="text-amber-400"
        />
        <StatCard
          title="Quizzes Attempted"
          value={report.totalQuizzes}
          icon={Target}
          colorClass="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <KnowledgeMap topics={finalMapData} />
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-3xl ring-1 ring-slate-700 border border-slate-700/50">
            <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" /> Improvement Areas
            </h4>
            {report.weaknesses.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No significant gaps detected yet. Keep quizzing!</p>
            ) : (
              <div className="space-y-4">
                {report.weaknesses.map((w, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl ring-1 ring-slate-800">
                    <span className="text-slate-200 font-medium capitalize">{w.topic}</span>
                    <span className="text-rose-400 font-bold">{w.accuracy}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 p-6 rounded-3xl ring-1 ring-slate-700 border border-slate-700/50">
            <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Brain size={18} className="text-emerald-400" /> Strengths
            </h4>
            {report.strengths.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Gathering data on your strengths...</p>
            ) : (
              <div className="space-y-4">
                {report.strengths.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl ring-1 ring-slate-800">
                    <span className="text-slate-200 font-medium capitalize">{s.topic}</span>
                    <span className="text-emerald-400 font-bold">{s.accuracy}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
