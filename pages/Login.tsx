import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="w-[360px] p-6 bg-[#1a1f2e] rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">{t('sidebar.brand')}</h1>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-1">{t('login.welcomeBack')}</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">Continue your learning journey</p>

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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className="w-full px-4 h-10 bg-[#0a0f1e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                aria-label={showPassword ? t('signup.hidePassword') : t('signup.showPassword')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-purple-400 text-sm hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[42px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
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
