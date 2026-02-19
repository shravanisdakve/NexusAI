import React from 'react';
import { PageHeader } from '../components/ui';
import { Brain, Grid3X3, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';


const QuizPractice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <PageHeader
        title={t('quiz.title')}
        subtitle={t('quiz.subtitle')}
      />

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        {/* Card 1 */}
        <div
          onClick={() => navigate('/interview')}
          className="cursor-pointer bg-slate-900 p-6 rounded-xl hover:border-purple-500 border border-slate-800 transition"
        >
          <Brain className="text-rose-400 mb-4" size={36} />
          <h3 className="text-lg font-semibold">{t('quiz.interviewTitle')}</h3>
          <p className="text-sm text-slate-400 mt-2">
            {t('quiz.interviewSubtitle')}
          </p>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => navigate('/sudoku')}
          className="cursor-pointer bg-slate-900 p-6 rounded-xl hover:border-purple-500 border border-slate-800 transition"
        >
          <Grid3X3 className="text-emerald-400 mb-4" size={36} />
          <h3 className="text-lg font-semibold">{t('quiz.sudokuTitle')}</h3>
          <p className="text-sm text-slate-400 mt-2">
            {t('quiz.sudokuSubtitle')}
          </p>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => navigate('/zip')}
          className="cursor-pointer bg-slate-900 p-6 rounded-xl hover:border-purple-500 border border-slate-800 transition"
        >
          <Zap className="text-yellow-400 mb-4" size={36} />
          <h3 className="text-lg font-semibold">{t('quiz.zipTitle')}</h3>
          <p className="text-sm text-slate-400 mt-2">
            {t('quiz.zipSubtitle')}
          </p>
        </div>
        {/* {Card 4} */}
{/* Card 4 */}
<div
  onClick={() => navigate('/speed-math')}
  className="cursor-pointer bg-slate-900 p-6 rounded-xl hover:border-purple-500 border border-slate-800 transition"
>
  <Calculator className="text-green-400 mb-4" size={36} />
  <h3 className="text-lg font-semibold">{t('quiz.speedMathTitle')}</h3>
  <p className="text-sm text-slate-400 mt-2">
    {t('quiz.speedMathSubtitle')}
  </p>
</div>


      </div>
    </div>
  );
};

export default QuizPractice;
