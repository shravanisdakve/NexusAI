

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard'; // Renamed StudyHub to Dashboard
import AITutor from './pages/AiChat'; // Renamed AiTutor to AITutor
import Login from './pages/Login';
import Signup from './pages/Signup';
import PersonalizationQuiz from './pages/PersonalizationQuiz';
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
import ATKTCalculator from './pages/ATKTCalculator';
import CurriculumExplorer from './pages/CurriculumExplorer';
import ResumeBuilder from './pages/ResumeBuilder';
import TopicPredictor from './pages/TopicPredictor';
import MUPaperBank from './pages/MUPaperBank';

import PlacementArena from './pages/PlacementArena';
import TCSNQTSimulator from './pages/TCSNQTSimulator';
import UniversityStatus from './pages/UniversityStatus';
import VivaSimulator from './pages/VivaSimulator';
import StudyPlan from './pages/StudyPlan';
import AptitudeTrainer from './pages/AptitudeTrainer';
import GDSimulator from './pages/GDSimulator';
import HRInterviewSimulator from './pages/HRInterviewSimulator';
import CompanyProfiles from './pages/CompanyProfiles';
import PlacementTracker from './pages/PlacementTracker';
import PracticeHub from './pages/PracticeHub';
import CompanyHub from './pages/CompanyHub';
import LearningResources from './pages/LearningResources';
import SmartStudy from './pages/SmartStudy';
import { useAuth } from './contexts/AuthContext';
import { Spinner } from '@/components/ui';
import { ModeProvider } from './contexts/ModeContext';
import Header from './components/Header';

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
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden">
      <div className="z-40 relative flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto flex flex-col relative w-full z-0">
        <Header />
        <div className="p-4 sm:p-6 lg:p-8 flex-1 h-full">
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
      <AppContent />
    </Router>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    const path = location.pathname;
    let title = 'NexusAI';
    let description = 'Next-gen academic excellence platform powered by AI.';

    const routeMap: Record<string, { title: string, desc: string }> = {
      '/': { title: 'Dashboard | NexusAI', desc: 'Manage your daily learning journey and focus goals.' },
      '/resources': { title: 'Resource Library | NexusAI', desc: 'Access comprehensive study materials and university resources.' },
      '/placement': { title: 'Placement Arena | NexusAI', desc: 'Prepare for top companies with AI-simulated tests and resources.' },
      '/notes': { title: 'My Notes | NexusAI', desc: 'Organize and analyze your study notes with AI flashcards.' },
      '/tutor': { title: 'AI Neural Tutor | NexusAI', desc: 'Get 24/7 academic assistance from our proprietary AI engine.' },
      '/insights': { title: 'AI Insights | NexusAI', desc: 'Deep analytics on your learning patterns and performance.' },
      '/curriculum': { title: 'Curriculum Explorer | NexusAI', desc: 'Navigate your course syllabus with university-specific insights.' },
      '/study-lobby': { title: 'Study Rooms | NexusAI', desc: 'Join collaborative study sessions with peers.' },
      '/quizzes': { title: 'Practice Center | NexusAI', desc: 'Test your knowledge with AI-generated custom quizzes.' },
      '/study-guru': { title: 'Smart Study | NexusAI', desc: 'Strategic study recommendations based on your unique profile.' },
      '/login': { title: 'Login | NexusAI', desc: 'Securely access your personalized learning dashboard.' },
      '/signup': { title: 'Join NexusAI', desc: 'Create your account to start your AI-powered academic journey.' },
      '/terms': { title: 'Terms of Service | NexusAI', desc: 'Read our platform usage policies and conditions.' },
      '/privacy': { title: 'Privacy Policy | NexusAI', desc: 'Understand how we protect your data and privacy.' },
      '/personalization': { title: 'Customize Your Experience | NexusAI', desc: 'Tailor your learning path with our personalization engine.' }
    };

    const route = Object.entries(routeMap).find(([p]) => path === p || (p !== '/' && path.startsWith(p)));
    
    if (route) {
      title = route[1].title;
      description = route[1].desc;
    }

    document.title = title;
    
    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [location]);

  return (
    <ModeProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/personalization" element={<PersonalizationQuiz />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
          <Route path="/curriculum" element={<ProtectedRoute><CurriculumExplorer /></ProtectedRoute>} />

          <Route path="/placement" element={<ProtectedRoute><PlacementArena /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/placement/tcs-nqt" element={<ProtectedRoute><TCSNQTSimulator /></ProtectedRoute>} />
          <Route path="/placement/:simulatorSlug" element={<ProtectedRoute><TCSNQTSimulator /></ProtectedRoute>} />
          <Route path="/university-status" element={<ProtectedRoute><UniversityStatus /></ProtectedRoute>} />
          <Route path="/practice-hub" element={<ProtectedRoute><PracticeHub /></ProtectedRoute>} />
          <Route path="/company-hub" element={<ProtectedRoute><CompanyHub /></ProtectedRoute>} />
          <Route path="/learning-resources" element={<ProtectedRoute><LearningResources /></ProtectedRoute>} />
          {/* Keep direct routes as fallbacks */}
          <Route path="/aptitude-trainer" element={<ProtectedRoute><PracticeHub /></ProtectedRoute>} />
          <Route path="/gd-simulator" element={<ProtectedRoute><PracticeHub /></ProtectedRoute>} />
          <Route path="/hr-interview" element={<ProtectedRoute><PracticeHub /></ProtectedRoute>} />
          <Route path="/company-profiles" element={<ProtectedRoute><CompanyHub /></ProtectedRoute>} />
          <Route path="/placement-tracker" element={<ProtectedRoute><CompanyHub /></ProtectedRoute>} />
          <Route path="/gpa-calculator" element={<ProtectedRoute><GPACalculator /></ProtectedRoute>} />
          <Route path="/project-generator" element={<ProtectedRoute><ProjectGenerator /></ProtectedRoute>} />
          <Route path="/kt-calculator" element={<ProtectedRoute><ATKTCalculator /></ProtectedRoute>} />
          <Route path="/mock-paper" element={<ProtectedRoute><MockPaperGenerator /></ProtectedRoute>} />
          <Route path="/topic-predictor" element={<ProtectedRoute><TopicPredictor /></ProtectedRoute>} />
          <Route path="/paper-bank" element={<ProtectedRoute><MUPaperBank /></ProtectedRoute>} />
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
          <Route path="/study-guru" element={<ProtectedRoute><SmartStudy /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ModeProvider>
  );
};

export default App;
