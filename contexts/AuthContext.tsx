import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { User } from '../types'; // Import User from types/index.ts
import { initializeSocket } from '../services/communityService'; // Added import

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (displayName: string, email: string, password: string, college: string, branch: string, year: number) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set the default base URL for axios
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Check for existing token on mount
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
      // Verify token with backend
      const response = await axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
        initializeSocket(token); // Initialize socket
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        initializeSocket(response.data.token); // Initialize socket
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      // Re-throw the error with the message from the backend
      throw new Error(error.response?.data?.message || 'Login failed due to a server error.');
    }
  };

  const signup = async (displayName: string, email: string, password: string, college: string, branch: string, year: number) => {
    try {
      const response = await axios.post('/api/auth/signup', {
        displayName,
        email,
        password,
        college,
        branch,
        year,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        initializeSocket(response.data.token); // Initialize socket
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Signup failed due to a server error.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send reset email due to a server error.');
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await axios.post(`/api/auth/reset-password/${token}`, { password });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password due to a server error.');
    }
  };

  // Kept from original file
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/auth/profile', updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile due to a server error.');
    }
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
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};