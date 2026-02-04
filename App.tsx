

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard'; // Renamed StudyHub to Dashboard
import AITutor from './pages/AiChat'; // Renamed AiTutor to AITutor
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudyRoom from './pages/StudyRoom';
import StudyLobby from './pages/StudyLobby';
import Insights from './pages/Insights';
import Notes from './pages/Notes';
import CourseCommunity from './pages/CourseCommunity';
import Quizzes from './pages/QuizPractice'; // Renamed QuizPractice to Quizzes
import InterviewQuiz from './pages/InterviewQuiz';
import SudokuGame from './pages/SudokuGame';
import ZipGame from './pages/ZipGame';
import SpeedMathGame from './pages/SpeedMathGame';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ResourceLibrary from './pages/ResourceLibrary'; // Import the new page
import GPACalculator from './pages/GPACalculator';
import ProjectGenerator from './pages/ProjectGenerator';
import MockPaperGenerator from './pages/MockPaperGenerator';
import ATKTCalculator from '@/pages/ATKTCalculator';
import CurriculumExplorer from './pages/CurriculumExplorer';
import EngineeringLab from './pages/EngineeringLab';
import MathLab from './pages/MathLab';
import PlacementArena from './pages/PlacementArena';
import TCSNQTSimulator from './pages/TCSNQTSimulator';
import UniversityStatus from './pages/UniversityStatus';
import VivaSimulator from './pages/VivaSimulator';
import StudyPlan from './pages/StudyPlan';
import { useAuth } from './contexts/AuthContext';
import { Spinner } from '@/components/ui';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); // Using isAuthenticated and loading from useAuth

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
        <Route path="/curriculum" element={<ProtectedRoute><CurriculumExplorer /></ProtectedRoute>} />
        <Route path="/engineering-lab" element={<ProtectedRoute><EngineeringLab /></ProtectedRoute>} />
        <Route path="/math-lab" element={<ProtectedRoute><MathLab /></ProtectedRoute>} />
        <Route path="/placement" element={<ProtectedRoute><PlacementArena /></ProtectedRoute>} />
        <Route path="/placement/tcs-nqt" element={<ProtectedRoute><TCSNQTSimulator /></ProtectedRoute>} />
        <Route path="/university-status" element={<ProtectedRoute><UniversityStatus /></ProtectedRoute>} />
        <Route path="/gpa-calculator" element={<ProtectedRoute><GPACalculator /></ProtectedRoute>} />
        <Route path="/project-generator" element={<ProtectedRoute><ProjectGenerator /></ProtectedRoute>} />
        <Route path="/kt-calculator" element={<ProtectedRoute><ATKTCalculator /></ProtectedRoute>} />
        <Route path="/mock-paper" element={<ProtectedRoute><MockPaperGenerator /></ProtectedRoute>} />
        <Route path="/viva-simulator" element={<ProtectedRoute><VivaSimulator /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
        <Route path="/study-lobby" element={<ProtectedRoute><StudyLobby /></ProtectedRoute>} />
        <Route path="/study-room/:id" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
        <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
        <Route path="/community/:courseId" element={<ProtectedRoute><CourseCommunity /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><InterviewQuiz /></ProtectedRoute>} />
        <Route path="/sudoku" element={<ProtectedRoute><SudokuGame /></ProtectedRoute>} />
        <Route path="/zip" element={<ProtectedRoute><ZipGame /></ProtectedRoute>} />
        <Route path="/speed-math" element={<ProtectedRoute><SpeedMathGame /></ProtectedRoute>} />
        <Route path="/study-plan" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;