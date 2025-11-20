
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { SetView } from './pages/SetView';
import { LearnMode } from './pages/LearnMode';
import { EditSet } from './pages/EditSet';
import { TestMode } from './pages/TestMode';
import { MatchMode } from './pages/MatchMode';
import { BlastMode } from './pages/BlastMode';
import { AIExamMode } from './pages/AIExamMode';
import { Folders } from './pages/Folders';
import { Profile } from './pages/Profile';
import { Welcome } from './pages/Welcome';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';

// Layout wrapper for pages that have the standard sidebar/topbar
const MainLayout: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="min-h-screen bg-bg-gray pb-20 md:pb-0">
    <TopBar />
    <Sidebar />
    {children}
    <MobileNav />
  </div>
);

// Guard to ensure user is authenticated before accessing protected routes
const ProtectedRoute: React.FC<{children: React.ReactElement}> = ({ children }) => {
  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected App Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Home />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/set/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <SetView />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/set/:id/learn" element={
          <ProtectedRoute>
            <LearnMode />
          </ProtectedRoute>
        } />
        <Route path="/set/:id/test" element={
          <ProtectedRoute>
            <TestMode />
          </ProtectedRoute>
        } />
        <Route path="/set/:id/match" element={
          <ProtectedRoute>
            <MatchMode />
          </ProtectedRoute>
        } />
        <Route path="/set/:id/blast" element={
          <ProtectedRoute>
            <BlastMode />
          </ProtectedRoute>
        } />
        <Route path="/set/:id/ai-exam" element={
          <ProtectedRoute>
            <AIExamMode />
          </ProtectedRoute>
        } />
        
        <Route path="/set/:id/edit" element={
          <ProtectedRoute>
            <EditSet />
          </ProtectedRoute>
        } />
        
        <Route path="/folders" element={
          <ProtectedRoute>
            <MainLayout>
              <Folders />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Fallback routes */}
        <Route path="/create" element={
          <ProtectedRoute>
            <EditSet />
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute>
            <MainLayout>
              <Folders />
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
