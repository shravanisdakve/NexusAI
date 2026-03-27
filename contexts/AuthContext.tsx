import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { User } from '../types';
import { initializeSocket } from '../services/communityService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (displayName: string, email: string, password: string, college: string, branch: string, year: number, additionalData?: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updateMood: (mood: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUser(response.data.user);
        initializeSocket(token);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        initializeSocket(response.data.token);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (displayName: string, email: string, password: string, college: string, branch: string, year: number, additionalData?: any) => {
    try {
      const response = await axios.post('/api/auth/signup', { ...additionalData, displayName, email, password, college, branch, year });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        initializeSocket(response.data.token);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const response = await axios.put('/api/auth/profile', updates);
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  };

  const updateMood = async (mood: string) => {
    try {
      const response = await axios.post('/api/auth/mood', { mood });
      if (response.data.success && user) {
        setUser({ ...user, currentMood: mood } as any);
      }
    } catch (error) {
      console.error('Mood update failed:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    await axios.post('/api/auth/forgot-password', { email });
  };

  const resetPassword = async (token: string, password: string) => {
    await axios.post(`/api/auth/reset-password/${token}`, { password });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
      updateUserProfile,
      updateMood,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within Provider');
  return context;
};