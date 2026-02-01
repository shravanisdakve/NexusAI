import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrainCircuit, Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const [apiError, setApiError] = useState(''); // Renamed to apiError to distinguish from form validation errors
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  // State for form validation errors
  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: ''
  });

  const validateForm = () => {
    const newErrors = { displayName: '', email: '', password: '', confirmPassword: '', terms: '' };
    let isValid = true;

    if (displayName.length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
      isValid = false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password strength validation: 8+ chars, at least one number, one special character
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    } else if (!/\d/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
      isValid = false;
    } else if (!/[!@#$%^&*()]/.test(password)) { // Expanded special characters for clarity
      newErrors.password = 'Password must contain at least one special character (!@#$%^&*())';
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!agreedToTerms) {
        newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy.';
        isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(''); // Clear previous API errors
    setErrors({ displayName: '', email: '', password: '', confirmPassword: '', terms: '' }); // Clear previous form errors
    
    if (!validateForm()) {
      return; // Stop if form validation fails
    }

    // University field is required but not part of the snippet's validation.
    // If it's empty, we'll set a general API error or handle it here.
    if (!university) {
        setApiError('Please fill in all fields including University Name.'); 
        return;
    }

    setLoading(true);
    try {
      await signup(displayName, email, university, password);
      navigate('/');
    } catch (err: any) {
      setApiError(err.message || 'Failed to create an account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 rounded-xl ring-1 ring-slate-700">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="p-2 bg-violet-600 rounded-lg">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold ml-3 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
            NexusAI
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-white">Create your Account</h2>
        <p className="mt-2 text-slate-400">Join NexusAI to supercharge your studies.</p>
      </div>
      
      {(apiError || errors.terms) && ( // Display general API errors or terms error at the top
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
          <p>{apiError || errors.terms}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setErrors(prev => ({ ...prev, displayName: '' })); }}
                placeholder="John Doe"
                required
                disabled={loading}
            />
            {errors.displayName && <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>}
        </div>
        <div>
            <label htmlFor="university" className="block text-sm font-medium text-slate-300 mb-2">University Name</label>
            <Input
                id="university"
                name="university"
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="State University"
                required
                disabled={loading}
            />
        </div>
        <div>
            <label htmlFor="email-signup" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <Input
                id="email-signup"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                placeholder="you@example.com"
                required
                disabled={loading}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
            <label htmlFor="password-signup" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
                <Input
                    id="password-signup"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            <p className="text-xs text-slate-500 mt-2">Must be at least 8 characters and include a number and a special character.</p>
        </div>
        <div>
            <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
                <Input
                    id="confirm-password-signup"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
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
                onChange={(e) => { setAgreedToTerms(e.target.checked); setErrors(prev => ({ ...prev, terms: '' })); }}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-slate-400">
                I agree to the{' '}
                <Link to="/terms" className="font-medium text-violet-400 hover:text-violet-300">
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-violet-400 hover:text-violet-300">
                    Privacy Policy
                </Link>
                .
            </label>
        </div>

        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 
                     disabled:cursor-not-allowed text-white rounded-lg transition-colors
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating Account...</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-sm text-center text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-violet-400 hover:text-violet-300">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Signup;