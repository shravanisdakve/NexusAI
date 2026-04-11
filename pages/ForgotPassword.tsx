import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setMessage(t('forgot.success'));
    } catch (err: any) {
      setError(err.message || t('forgot.errorFallback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <div className="w-full max-w-md p-8 bg-[#1a1f2e] rounded-2xl border border-gray-800">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('sidebar.brand')}</h1>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">{t('forgot.title')}</h2>
        <p className="text-gray-400 text-center mb-6">{t('forgot.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium">✅ Reset link sent</p>
                <p className="text-slate-400 text-sm mt-1">Check your email ({email})</p>
              </div>
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-transparent border border-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all text-sm"
                >
                  {loading ? 'Resending...' : 'Resend'}
                </button>
                <Link to="/login" className="block w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-center transition-all shadow-lg text-sm">
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="email" className="block text-gray-300 text-sm mb-2">{t('login.email')}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className="w-full px-4 h-10 bg-[#0a0f1e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.includes('@')}
                className="w-full h-[42px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('forgot.sending')}</span>
                  </>
                ) : (
                  t('forgot.send')
                )}
              </button>
            </>
          )}
          {t('forgot.remember')}{' '}
          <Link to="/login" className="text-purple-400 hover:underline">
            {t('forgot.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
