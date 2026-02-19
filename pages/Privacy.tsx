import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Privacy: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[#1a1f2e] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors" aria-label={t('privacy.backToLogin')}>
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-4xl font-bold text-white">{t('privacy.title')}</h1>
        </div>

        <div className="space-y-6 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">{t('privacy.section1Title')}</h2>
            <p>{t('privacy.section1Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">{t('privacy.section2Title')}</h2>
            <p>{t('privacy.section2Body')}</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>{t('privacy.personalDataLabel')}</strong> {t('privacy.personalDataValue')}</li>
              <li><strong>{t('privacy.usageDataLabel')}</strong> {t('privacy.usageDataValue')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">{t('privacy.section3Title')}</h2>
            <p>{t('privacy.section3Body')}</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>{t('privacy.section3Item1')}</li>
              <li>{t('privacy.section3Item2')}</li>
              <li>{t('privacy.section3Item3')}</li>
              <li>{t('privacy.section3Item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">{t('privacy.section4Title')}</h2>
            <p>{t('privacy.section4Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">{t('privacy.section5Title')}</h2>
            <p>{t('privacy.section5Body')}</p>
          </section>

          <div className="pt-8 border-t border-gray-800 text-center">
            <Link to="/login" className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all">
              {t('privacy.returnToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
