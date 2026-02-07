import React, { useState, useCallback, useEffect, Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import MachineList from './components/MachineList';
import EquipmentInsight from './components/EquipmentInsight';
import Analytics from './components/Analytics';
import FuelConsumptionReport from './components/FuelConsumptionReport';
import Login from './components/Login';
import TemperatureMachineList from './components/temperature/TemperatureMachineList';
import TemperatureAnalytics from './components/temperature/TemperatureAnalytics';
import TemperatureLogs from './components/temperature/TemperatureLogs';
// Import Fire & Safety components
import FireSafetyMachineList from './components/fire-safety/FireSafetyMachineList';
import FireSafetyAnalytics from './components/fire-safety/FireSafetyAnalytics';
import FireSafetyLogs from './components/fire-safety/FireSafetyLogs';
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
  const [activeApp, setActiveApp] = useState(() => {
    // Initialize from localStorage if available
    const savedApp = localStorage.getItem('activeApp');
    return savedApp ? JSON.parse(savedApp) : null;
  });
  const { isLoggedIn, loading, userData } = useAuth();

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

  // Persist activeApp to localStorage whenever it changes
  useEffect(() => {
    if (activeApp) {
      localStorage.setItem('activeApp', JSON.stringify(activeApp));
    } else {
      localStorage.removeItem('activeApp');
    }
  }, [activeApp]);

  // Component wrapper for protected routes
  const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, loading } = useAuth();
    
    // Show loading state while auth state is being initialized
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      );
    }
    
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <Fragment>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                  <div>Loading...</div>
                </div>
              ) : isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )}
            </Fragment>
          } />
          <Route path="/login" element={
            <Fragment>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                  <div>Loading...</div>
                </div>
              ) : isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )}
            </Fragment>
          } />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <Dashboard onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <Logs onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/machine-list" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <MachineList onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/equipment-insight" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <EquipmentInsight onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <Analytics onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <FuelConsumptionReport onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          
          {/* Temperature application routes */}
          <Route path="/temperature/machine-list" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <TemperatureMachineList onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          
          <Route path="/temperature/analytics" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <TemperatureAnalytics onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          
          <Route path="/temperature/logs" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <TemperatureLogs onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          
          {/* Fire & Safety application routes */}
          <Route path="/fire-safety/machine-list" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <FireSafetyMachineList onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          
          <Route path="/fire-safety/analytics" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <FireSafetyAnalytics onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
              </main>
            </ProtectedRoute>
          } />
          
          <Route path="/fire-safety/logs" element={
            <ProtectedRoute>
              <Navbar onMenuClick={handleMenuToggle} onSidebarToggle={handleSidebarToggle} activeApp={activeApp} setActiveApp={setActiveApp} />
              <Sidebar 
                mobileOpen={mobileMenuOpen} 
                onClose={handleMenuClose}
                visible={sidebarVisible}
                onSidebarHide={handleSidebarHide}
                onSidebarToggle={handleSidebarToggle}
                activeApp={activeApp}
              />
              <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                <FireSafetyLogs onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />
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