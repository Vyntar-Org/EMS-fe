import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import MachineList from './components/MachineList';
import EquipmentInsight from './components/EquipmentInsight';
import Analytics from './components/Analytics';
import Login from './components/Login';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false); // Sidebar hidden by default
  const { isLoggedIn } = useAuth();

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  const handleSidebarHide = useCallback(() => setSidebarVisible(false), []);

  // Component wrapper for protected routes
  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <Dashboard onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <Logs onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/machine-list" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <MachineList onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/equipment-insight" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <EquipmentInsight onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <Analytics onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;