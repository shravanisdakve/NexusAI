import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner } from '../components/ui';
import { Clock, Gamepad2, Activity, Zap, Brain, Target, ShieldAlert, Sparkles } from 'lucide-react';
import { getProductivityReport } from '../services/analyticsService';
import KnowledgeMap from '../components/KnowledgeMap';
import { useLanguage } from '../contexts/LanguageContext';
import { generateKnowledgeMap } from '../services/geminiService';

// -------------------- TYPES --------------------
interface ProductivityData {
  totalStudyTime: number;
  quizAccuracy: number;
  totalQuizzes: number;
  correctQuizzes: number;
  strengths: { topic: string; accuracy: number; count: number }[];
  weaknesses: { topic: string; accuracy: number; count: number }[];
  completedPomodoros: number;
  quizHistory?: any[];
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

const Insights: React.FC = () => {
  const { t, language } = useLanguage();
  const [report, setReport] = useState<ProductivityData | null>(null);
  const [aiMapData, setAiMapData] = useState<{ name: string; strength: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return t('insights.zeroSeconds');
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const data: any = await getProductivityReport();
      setReport(data);
      setLoading(false);

      if (data && data.quizHistory && data.quizHistory.length > 0) {
        setAiLoading(true);
        try {
          const aiTopics = await generateKnowledgeMap(data.quizHistory, language);
          setAiMapData(aiTopics);
        } catch (err) {
          console.error("AI Map generation failed:", err);
        } finally {
          setAiLoading(false);
        }
      }
    };
    fetchReport();
  }, [language]);

  if (loading || !report) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  // Final Map Data: AI Data > Strengths/Weaknesses > Placeholder
  let finalMapData = aiMapData;
  
  if (finalMapData.length === 0) {
    const fallbackData = [...report.strengths, ...report.weaknesses].map(t => ({
      name: t.topic,
      strength: t.accuracy / 100
    }));
    finalMapData = fallbackData.length > 0 ? fallbackData : [
      { name: 'Applied Mathematics', strength: 0.72 },
      { name: 'Engineering Physics', strength: 0.68 },
      { name: 'Basic Electrical Eng', strength: 0.64 },
    ];
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title={t('insights.title')}
        subtitle={t('insights.subtitle')}
      />


      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('insights.studyTimeWeekly')}
          value={formatTime(report.totalStudyTime)}
          icon={Clock}
          colorClass="text-sky-400"
        />
        <StatCard
          title={t('insights.quizAccuracy')}
          value={report.totalQuizzes > 0 ? `${report.quizAccuracy}%` : '0%'}
          icon={Brain}
          colorClass="text-rose-400"
        />
        <StatCard
          title={t('insights.completedPomodoros')}
          value={report.completedPomodoros}
          icon={Zap}
          colorClass="text-amber-400"
        />
        <StatCard
          title={t('insights.quizzesAttempted')}
          value={report.totalQuizzes}
          icon={Target}
          colorClass="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          {(aiMapData.length > 0 || aiLoading) && (
            <div className={`absolute -top-4 -right-4 bg-violet-600 text-white text-[10px] px-2 py-1 rounded-full font-bold z-10 shadow-lg shadow-violet-500/50 flex items-center gap-1 ${aiLoading ? 'animate-pulse' : ''}`}>
              <Sparkles size={10} /> {aiLoading ? 'ANALYZING...' : 'AI GENERATED'}
            </div>
          )}
          <div className={aiLoading ? 'opacity-50 blur-sm transition-all duration-1000' : 'transition-all duration-1000'}>
            <KnowledgeMap topics={finalMapData} />
          </div>
          {aiLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-violet-500/50 text-violet-400 text-sm font-bold flex items-center gap-2">
                <Brain size={16} className="animate-bounce" /> Analyzing Quiz Patterns...
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-3xl ring-1 ring-slate-700 border border-slate-700/50">
            <h4 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-400" /> {t('insights.improvementAreas')}
            </h4>
            {report.weaknesses.length === 0 ? (
              <p className="text-sm text-slate-400 italic">{t('insights.noGaps')}</p>
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
              <Brain size={18} className="text-emerald-400" /> {t('insights.strengths')}
            </h4>
            {report.strengths.length === 0 ? (
              <p className="text-sm text-slate-400 italic">{t('insights.gatheringStrengths')}</p>
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
