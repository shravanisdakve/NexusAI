import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
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
      setMessage('A password reset link has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
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

        <h2 className="text-2xl font-bold text-white text-center mb-2">Forgot Password?</h2>
        <p className="text-gray-400 text-center mb-6">Enter your email and we'll send you a reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm mb-2">Email Address</label>
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
                <span>Sending...</span>
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <p className="text-center text-gray-400 mt-6 text-sm">
          Remember your password?{' '}
          <Link to="/login" className="text-purple-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;