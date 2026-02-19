import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Terms: React.FC = () => {
  const { t } = useLanguage();

  const sections = [
    { title: t('terms.section1Title'), paragraphs: [t('terms.section1Body')] },
    { title: t('terms.section2Title'), paragraphs: [t('terms.section2Body1'), t('terms.section2Body2')] },
    { title: t('terms.section3Title'), paragraphs: [t('terms.section3Body')] },
    { title: t('terms.section4Title'), paragraphs: [t('terms.section4Body')] },
    { title: t('terms.section5Title'), paragraphs: [t('terms.section5Body')] },
    { title: t('terms.section6Title'), paragraphs: [t('terms.section6Body')] },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[#1a1f2e] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors" aria-label={t('terms.backToLogin')}>
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-4xl font-bold text-white">{t('terms.title')}</h1>
        </div>

        <div className="space-y-6 text-lg leading-relaxed">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold text-white mb-3">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2 first:mt-0">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <div className="pt-8 border-t border-gray-800 text-center">
            <Link to="/login" className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all">
              {t('terms.returnToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
