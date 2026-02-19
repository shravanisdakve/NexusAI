import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t('login.invalidCredentials'));
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

        <h2 className="text-2xl font-bold text-white text-center mb-2">{t('login.welcomeBack')}</h2>
        <p className="text-gray-400 text-center mb-6">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

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
              className="w-full px-4 py-3 bg-[#0a0f1e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm mb-2">{t('login.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              className="w-full px-4 py-3 bg-[#0a0f1e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
              disabled={loading}
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-purple-400 text-sm hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('login.loggingIn')}</span>
              </>
            ) : (
              t('login.logIn')
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          {t('login.noAccount')}{' '}
          <Link to="/personalization" className="text-purple-400 hover:underline font-medium">
            {t('login.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
