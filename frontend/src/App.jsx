import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, NavLink } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoom from './pages/InterviewRoom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DuelRoom from './pages/DuelRoom';
import TalentAnalytics from './pages/TalentAnalytics';
import ForgeOnboarding from './pages/ForgeOnboarding';
import JobMatchHub from './pages/JobMatchHub';
import PracticeHub from './pages/PracticeHub';
import CommunityQuests from './pages/CommunityQuests';
import Achievements from './pages/Achievements';
import QuizBattleRoom from './pages/QuizBattleRoom';
import TopicStudy from './pages/TopicStudy';
import AdaptiveQuiz from './pages/AdaptiveQuiz';
import AiMentor from './pages/AiMentor';
import AiMentorPro from './pages/AiMentorPro';
import OnboardingModal, { shouldShowOnboarding } from './components/OnboardingModal';
import JobNotifier from './components/JobNotifier';
import StarField from './components/StarField';
import Aurora from './components/Aurora';
import {
    Loader2, Menu, X
} from 'lucide-react';
import Navigation from './components/Navigation';
import TopNavbar from './components/TopNavbar';
import GridBackground from './components/GridBackground';
import playSound from './utils/sounds';
import LogoutModal from './components/LogoutModal';

const getInitialTheme = () => localStorage.getItem('theme') || 'dark';
const applyTheme = (theme) => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
};

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return (
        <div className="flex-center" style={{ height: '100vh' }}>
            <Loader2 className="animate-spin" size={32} color="var(--violet-light)" />
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;
    return children;
};


const AppContent = () => {
    const { user, logout, loading } = useContext(AuthContext);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [theme, setTheme] = useState(getInitialTheme);
    const location = useLocation();
    const isFullscreen = ['/interview'].includes(location.pathname);
    const normalizedPath = location.pathname.toLowerCase().replace(/\/$/, '');
    const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(normalizedPath) || location.pathname === '/login' || location.pathname === '/register';
    const isLandingPage = normalizedPath === '' || location.pathname === '/';

    useEffect(() => { applyTheme(theme); }, [theme]);
    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    useEffect(() => {
        if (!loading && user && shouldShowOnboarding()) setShowOnboarding(true);
    }, [user, loading]);

    // Global Interaction Sounds
    useEffect(() => {
        const handleGlobalClick = (e) => {
            const target = e.target.closest('button, a, .btn, .sidebar-link');
            if (target) {
                playSound('click');
            }
        };

        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const showSidebar = !isFullscreen && !isAuthPage && !!user && !isLandingPage;
    
    return (
        <>
            <style>{`
                ${isAuthPage ? `
                #main-app-container {
                    padding-left: 0 !important;
                    margin-left: 0 !important;
                }
                .sidebar {
                    display: none !important;
                }
                ` : ''}
                @media (max-width: 768px) {
                    #main-app-container { padding-left: 0 !important; }
                }
            `}</style>
            <GridBackground />
            <JobNotifier />
            {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
            
            {/* Mobile Hamburger Header */}
            {showSidebar && (
                <div className="show-mobile" style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, height: '64px', 
                    background: 'var(--bg-sidebar)', backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--border)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', padding: '0 1.5rem',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                        <span className="text-gradient" style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>AlgoPrep</span>
                    </Link>
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="btn-icon"
                        style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-main)', 
                            cursor: 'pointer',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            )}

            {/* Conditional Navigation */}
            {isLandingPage && !user ? (
                <TopNavbar theme={theme} toggleTheme={toggleTheme} />
            ) : (
                showSidebar && (
                    <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                         {/* Mobile Overlay */}
                        {isMobileMenuOpen && (
                            <div 
                                onClick={() => setIsMobileMenuOpen(false)}
                                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
                            />
                        )}
                        <Navigation 
                            theme={theme} 
                            toggleTheme={toggleTheme} 
                            onLogoutClick={() => setIsLogoutModalOpen(true)}
                            isMobileOpen={isMobileMenuOpen}
                            onCloseMobile={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                )
            )}
            <LogoutModal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                onConfirm={() => {
                    logout();
                    setIsLogoutModalOpen(false);
                    setIsMobileMenuOpen(false);
                }}
            />
            <div 
                id="main-app-container"
                style={{ 
                    paddingLeft: showSidebar ? 'var(--sidebar-width)' : 0,
                    paddingTop: (showSidebar && window.innerWidth <= 768) ? '60px' : 0,
                    transition: 'padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '100vh',
                    width: '100%'
                }}
            >
                <Routes>
                    {/* Public */}
                    <Route path="/" element={user && !loading ? <Navigate to="/app" replace /> : <Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected */}
                    <Route path="/app"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/setup"    element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
                    <Route path="/interview" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
                    <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                    <Route path="/duel"     element={<ProtectedRoute><DuelRoom /></ProtectedRoute>} />
                    <Route path="/duel/:roomId" element={<ProtectedRoute><DuelRoom /></ProtectedRoute>} />
                    <Route path="/talent"   element={<ProtectedRoute><TalentAnalytics /></ProtectedRoute>} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/forge"    element={<ProtectedRoute><ForgeOnboarding /></ProtectedRoute>} />
                    <Route path="/jobs"     element={<ProtectedRoute><JobMatchHub /></ProtectedRoute>} />
                    <Route path="/practice" element={<ProtectedRoute><PracticeHub /></ProtectedRoute>} />
                    <Route path="/study"    element={<ProtectedRoute><TopicStudy /></ProtectedRoute>} />
                    <Route path="/community" element={<ProtectedRoute><CommunityQuests /></ProtectedRoute>} />
                    <Route path="/battle"   element={<ProtectedRoute><QuizBattleRoom /></ProtectedRoute>} />
                    <Route path="/quiz"     element={<ProtectedRoute><AdaptiveQuiz /></ProtectedRoute>} />
                    <Route path="/ai-mentor" element={<ProtectedRoute><AiMentor /></ProtectedRoute>} />
                    <Route path="/ai-mentor-pro" element={<ProtectedRoute><AiMentorPro /></ProtectedRoute>} />
                </Routes>
            </div>
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
