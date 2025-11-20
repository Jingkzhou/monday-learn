
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
          <MainLayout>
            <Home />
          </MainLayout>
        } />
        
        <Route path="/set/:id" element={
          <MainLayout>
            <SetView />
          </MainLayout>
        } />
        
        <Route path="/set/:id/learn" element={<LearnMode />} />
        <Route path="/set/:id/test" element={<TestMode />} />
        <Route path="/set/:id/match" element={<MatchMode />} />
        <Route path="/set/:id/blast" element={<BlastMode />} />
        <Route path="/set/:id/ai-exam" element={<AIExamMode />} />
        
        <Route path="/set/:id/edit" element={<EditSet />} />
        
        <Route path="/folders" element={
           <MainLayout>
            <Folders />
          </MainLayout>
        } />

        <Route path="/profile" element={
           <MainLayout>
            <Profile />
          </MainLayout>
        } />

        {/* Fallback routes */}
        <Route path="/create" element={<EditSet />} />
        <Route path="/library" element={
          <MainLayout>
            <Folders />
          </MainLayout>
        } />
      </Routes>
    </Router>
  );
};

export default App;
