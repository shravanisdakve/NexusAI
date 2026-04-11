import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Eye, EyeOff } from 'lucide-react';
import { Input, Select } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const personalizationData = location.state?.personalizationData || {};

  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  const validateForm = () => {
    const newErrors = {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: '',
    };
    let isValid = true;

    if (displayName.trim().length < 2) {
      newErrors.displayName = t('signup.error.nameMin');
      isValid = false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('signup.error.emailInvalid');
      isValid = false;
    }
    if (password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
      newErrors.password = t('signup.error.passwordWeak');
      isValid = false;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('signup.error.passwordMismatch');
      isValid = false;
    }
    if (!agreedToTerms) {
      newErrors.terms = t('signup.error.termsRequired');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await signup(
        displayName,
        email,
        password,
        personalizationData.college || 'Not Provided',
        personalizationData.branch || 'Not Provided',
        parseInt(personalizationData.year?.replace(/\D/g, '') || '1', 10),
        personalizationData
      );
      navigate('/');
    } catch (err: any) {
      setApiError(err.message || t('signup.error.apiFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/50 rounded-xl ring-1 ring-slate-700">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="p-2 bg-violet-600 rounded-lg">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold ml-3 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
              {t('sidebar.brand')}
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-white">{t('signup.title')}</h2>
          <p className="mt-2 text-slate-400">{t('signup.subtitle')}</p>
        </div>

        {(apiError || errors.terms) && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            <p>{apiError || errors.terms}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">{t('signup.fullName')}</label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('signup.fullNamePlaceholder')}
              required
              disabled={loading}
            />
            {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>}
          </div>

          <div>
            <label htmlFor="email-signup" className="block text-sm font-medium text-slate-300 mb-2">{t('login.email')}</label>
            <Input
              id="email-signup"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              disabled={loading}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password-signup" className="block text-sm font-medium text-slate-300 mb-2">{t('login.password')}</label>
            <div className="relative">
              <Input
                id="password-signup"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? t('signup.hidePassword') : t('signup.showPassword')}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-slate-300 mb-2">{t('signup.confirmPassword')}</label>
            <div className="relative">
              <Input
                id="confirm-password-signup"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                aria-label={showConfirmPassword ? t('signup.hidePassword') : t('signup.showPassword')}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-slate-400">
              {t('signup.termsPrefix')}{' '}
              <Link to="/terms" className="font-medium text-violet-400 hover:text-violet-300">
                {t('signup.termsOfService')}
              </Link>{' '}
              {t('signup.and')}{' '}
              <Link to="/privacy" className="font-medium text-violet-400 hover:text-violet-300">
                {t('signup.privacyPolicy')}
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full h-[42px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t('signup.creatingAccount')}</span>
              </>
            ) : (
              t('signup.createAccount')
            )}
          </button>
        </form>

        <p className="text-sm text-center text-slate-400">
          {t('signup.alreadyAccount')}{' '}
          <Link to="/login" className="font-medium text-violet-400 hover:text-violet-300">
            {t('signup.logIn')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
