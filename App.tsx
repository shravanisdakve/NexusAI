

import React from 'react';
import { TimerProvider } from './contexts/TimerContext';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard'; // Renamed StudyHub to Dashboard
import AITutor from './pages/AiChat'; // Renamed AiTutor to AITutor
import Login from './pages/Login';
import Signup from './pages/Signup';
import PersonalizationQuiz from './pages/PersonalizationQuiz';
import StudyRoom from './pages/StudyRoom';
import StudyLobby from './pages/StudyLobby';
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
import ResumePrint from './pages/ResumePrint';
import TopicPredictor from './pages/TopicPredictor';
import MUPaperBank from './pages/MUPaperBank';
import TimerPage from './pages/TimerPage';
import Offline from './pages/Offline';
import Leaderboard from './pages/Leaderboard';



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
import PrepTools from './pages/PrepTools';
import SmartStudy from './pages/SmartStudy';
import { useAuth } from './contexts/AuthContext';
import { Spinner } from '@/components/ui';
import { ModeProvider } from './contexts/ModeContext';
import Header from './components/Header';
import { SidebarProvider } from './contexts/SidebarContext';
import MobileBottomNav from './components/MobileBottomNav';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import FeatureManagement from './pages/admin/FeatureManagement';
import RoomManagement from './pages/admin/RoomManagement';
import AdminLogs from './pages/admin/AdminLogs';
import AIControl from './pages/admin/AIControl';
import ContentManagement from './pages/admin/ContentManagement';
import CurriculumManagement from './pages/admin/CurriculumManagement';
import QuizManagement from './pages/admin/QuizManagement';
import ReportManagement from './pages/admin/ReportManagement';
import AdminSettings from './pages/admin/AdminSettings';
import ViewProfilePage from './pages/profile/ViewProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import ProfileSettingsPage from './pages/profile/ProfileSettingsPage';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex bg-[#050608] items-center justify-center min-h-screen text-violet-500 font-bold tracking-widest uppercase">Initializing Console...</div>;
  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superadmin')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

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
    <div className="bg-[#050608] min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden w-full max-w-[177.78vh] shadow-2xl relative ring-1 ring-white/5">
        <div className="z-50 relative flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col relative w-full h-screen overflow-hidden z-20">
          <Header />
          <div className="flex-1 relative overflow-y-auto no-scrollbar min-w-0 min-h-0">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
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
      '/tutor': { title: 'AI Study Buddy | NexusAI', desc: 'Personalized AI tutoring for Mumbai University courses.' },
      '/timer': { title: 'Focus Timer | NexusAI', desc: 'Boost productivity with our integrated Pomodoro study timer.' },
      '/curriculum': { title: 'Exam Blueprints | NexusAI', desc: 'Navigate your course syllabus with university-specific insights.' },
      '/study-lobby': { title: 'Study Rooms | NexusAI', desc: 'Join collaborative study sessions with peers.' },
      '/quizzes': { title: 'Practice Lab | NexusAI', desc: 'Test your knowledge with AI-generated custom quizzes.' },
      '/study-guru': { title: 'Smart Study | NexusAI', desc: 'Strategic study recommendations based on your unique profile.' },
      '/login': { title: 'Login | NexusAI', desc: 'Securely access your personalized learning dashboard.' },
      '/signup': { title: 'Join NexusAI', desc: 'Create your account to start your AI-powered academic journey.' },
      '/offline': { title: 'Slow Connection | NexusAI', desc: 'You are currently disconnected from our neural engines.' },
      '/terms': { title: 'Terms of Service | NexusAI', desc: 'Read our platform usage policies and conditions.' },
      '/privacy': { title: 'Privacy Policy | NexusAI', desc: 'Understand how we protect your data and privacy.' },
      '/personalization': { title: 'Customize Your Experience | NexusAI', desc: 'Tailor your learning path with our personalization engine.' },
      '/leaderboard': { title: 'Global Arena | Leaderboard', desc: 'Compete with peers and climb the Nexus global rankings.' }


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
    <SidebarProvider>
      <TimerProvider>
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
            <Route path="/offline" element={<Offline />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
            <Route path="/curriculum" element={<ProtectedRoute><CurriculumExplorer /></ProtectedRoute>} />

            <Route path="/placement" element={<ProtectedRoute><PlacementArena /></ProtectedRoute>} />
            <Route path="/prep-tools" element={<ProtectedRoute><PrepTools /></ProtectedRoute>} />
            <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
            <Route path="/resume-print" element={<ResumePrint />} />
            <Route path="/placement/tcs-nqt" element={<ProtectedRoute><TCSNQTSimulator /></ProtectedRoute>} />
            <Route path="/placement/companies" element={<Navigate to="/company-hub" replace />} />
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
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
            <Route path="/ai-tutor" element={<Navigate to="/tutor" replace />} />
            <Route path="/practice-hub" element={<ProtectedRoute><PracticeHub /></ProtectedRoute>} />
            <Route path="/practice" element={<Navigate to="/practice-hub" replace />} />
            <Route path="/timer" element={<ProtectedRoute><TimerPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

            <Route path="/study-lobby" element={<ProtectedRoute><StudyLobby /></ProtectedRoute>} />
            <Route path="/study-room" element={<Navigate to="/study-lobby" replace />} />

            <Route path="/study-room/:id" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
            <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
            <Route path="/community/:courseId" element={<ProtectedRoute><CourseCommunity /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><InterviewQuiz /></ProtectedRoute>} />
            <Route path="/sudoku" element={<ProtectedRoute><SudokuGame /></ProtectedRoute>} />
            <Route path="/zip" element={<ProtectedRoute><ZipGame /></ProtectedRoute>} />
            <Route path="/speed-math" element={<ProtectedRoute><SpeedMathGame /></ProtectedRoute>} />
            <Route path="/study-plan" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />
            <Route path="/study-guru" element={<ProtectedRoute><SmartStudy /></ProtectedRoute>} />
            
            {/* Profile & Account Routes */}
            <Route path="/profile" element={<ProtectedRoute><ViewProfilePage /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
            <Route path="/profile/settings" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="rooms" element={<RoomManagement />} />
              <Route path="ai" element={<AIControl />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="curriculum" element={<CurriculumManagement />} />
              <Route path="quizzes" element={<QuizManagement />} />
              <Route path="reports" element={<ReportManagement />} />
              <Route path="features" element={<FeatureManagement />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ModeProvider>
      </TimerProvider>
    </SidebarProvider>
  );
};

export default App;
