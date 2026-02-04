import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { resetPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 8) {
            return setError('Password must be at least 8 characters long');
        }

        setLoading(true);

        try {
            if (!token) throw new Error('Invalid reset token');
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. The link may have expired.');
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

                <h2 className="text-2xl font-bold text-white text-center mb-2">Reset Password</h2>
                <p className="text-gray-400 text-center mb-6">Enter your new password below.</p>

                {success ? (
                    <div className="text-center">
                        <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg mb-6">
                            <p className="text-green-400">Password reset successful! Redirecting to login...</p>
                        </div>
                        <Link to="/login" className="text-purple-400 hover:underline">
                            Go to Login now
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-gray-300 text-sm mb-2">New Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#0a0f1e] border border-gray-700 rounded-lg 
                           text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-gray-300 text-sm mb-2">Confirm New Password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
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
                                    <span>Resetting...</span>
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
