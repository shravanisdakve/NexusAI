import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrainCircuit } from 'lucide-react';
import { Button, Input } from '../components/ui';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!displayName || !email || !password || !university) {
        setError('Please fill in all fields.');
        return;
    }
    setError('');
    setLoading(true);
    try {
      await signup(displayName, email, university, password);
      navigate('/');
    } catch (err: any) {
      setError('Failed to create an account. Please try again.');
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
      
      {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={loading}
            />
        </div>
        <div>
            <label htmlFor="university" className="block text-sm font-medium text-slate-300 mb-2">University Name</label>
            <Input
                id="university"
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
            />
        </div>
        <div>
            <label htmlFor="password-signup" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <Input
                id="password-signup"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
            />
        </div>
        <Button type="submit" isLoading={loading} className="w-full">
          Create Account
        </Button>
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