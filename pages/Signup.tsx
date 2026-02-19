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
  const [college, setCollege] = useState(personalizationData.college || '');
  const [branch, setBranch] = useState(personalizationData.branch || '');
  const [year, setYear] = useState(personalizationData.year ? personalizationData.year.replace(/\D/g, '') : '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    branch: '',
    year: '',
    terms: '',
  });

  const validateForm = () => {
    const newErrors = {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      college: '',
      branch: '',
      year: '',
      terms: '',
    };
    let isValid = true;

    if (displayName.trim().length < 2) {
      newErrors.displayName = t('signup.error.nameMin');
      isValid = false;
    }
    if (college.trim().length < 2) {
      newErrors.college = t('signup.error.collegeRequired');
      isValid = false;
    }
    if (!branch) {
      newErrors.branch = t('signup.error.branchRequired');
      isValid = false;
    }
    if (!year) {
      newErrors.year = t('signup.error.yearRequired');
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
        college,
        branch,
        parseInt(year, 10),
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
          {Object.keys(personalizationData).length > 0 && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 flex justify-between items-center mb-4">
              <span className="text-sm text-violet-300">{t('signup.personalizedSettings')}</span>
              <Link to="/personalization" className="text-xs text-white bg-violet-600 px-2 py-1 rounded hover:bg-violet-700 transition-colors">
                {t('signup.edit')}
              </Link>
            </div>
          )}

          <div>
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
            <label htmlFor="college" className="block text-sm font-medium text-slate-300 mb-2">{t('signup.college')}</label>
            <Input
              id="college"
              name="college"
              type="text"
              autoComplete="organization"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder={t('signup.collegePlaceholder')}
              required
              disabled={loading || !!personalizationData.college}
              className={personalizationData.college ? 'opacity-70 cursor-not-allowed bg-slate-900 border-slate-700' : ''}
            />
            {errors.college && <p className="text-red-400 text-xs mt-1">{errors.college}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-slate-300 mb-2">{t('signup.branch')}</label>
              <Select
                id="branch"
                name="branch"
                autoComplete="organization-level-2"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                disabled={loading || !!personalizationData.branch}
                className={personalizationData.branch ? 'opacity-70 cursor-not-allowed bg-slate-900 border-slate-700' : ''}
              >
                <option value="">{t('signup.selectBranch')}</option>
                <option value="CSE">{t('signup.branch.cse')}</option>
                <option value="ECE">{t('signup.branch.ece')}</option>
                <option value="ME">{t('signup.branch.me')}</option>
                <option value="CE">{t('signup.branch.ce')}</option>
                <option value="EE">{t('signup.branch.ee')}</option>
                <option value="IT">{t('signup.branch.it')}</option>
                <option value="Other">{t('signup.branch.other')}</option>
              </Select>
              {errors.branch && <p className="text-red-400 text-xs mt-1">{errors.branch}</p>}
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-300 mb-2">{t('signup.year')}</label>
              <Select
                id="year"
                name="year"
                autoComplete="organization-level-3"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                disabled={loading || !!personalizationData.year}
                className={personalizationData.year ? 'opacity-70 cursor-not-allowed bg-slate-900 border-slate-700' : ''}
              >
                <option value="">{t('signup.selectYear')}</option>
                <option value="1">{t('signup.year.1')}</option>
                <option value="2">{t('signup.year.2')}</option>
                <option value="3">{t('signup.year.3')}</option>
                <option value="4">{t('signup.year.4')}</option>
              </Select>
              {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year}</p>}
            </div>
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
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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
