import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
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
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <div className="w-full max-w-md p-8 bg-[#1a1f2e] rounded-2xl border border-gray-800">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-white">NexusAI</h1>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back!</h2>
        <p className="text-gray-400 text-center mb-6">Unlock your smarter study session.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-[#0a0f1e] border border-gray-700 rounded-lg 
                         text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#0a0f1e] border border-gray-700 rounded-lg 
                         text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
              disabled={loading}
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <a href="/#/forgot-password" className="text-purple-400 text-sm hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 
                       disabled:cursor-not-allowed text-white font-semibold rounded-lg 
                       transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-gray-400 mt-6 text-sm">
          Don't have an account?{' '}
          <a href="/#/signup" className="text-purple-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;