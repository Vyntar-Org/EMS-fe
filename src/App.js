import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import MachineList from './components/MachineList';
import EquipmentInsight from './components/EquipmentInsight';
import Analytics from './components/Analytics';
import './App.css';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false); // Sidebar hidden by default

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

  return (
    <Router>
      <div className="App">
        <Navbar onMenuClick={handleMenuToggle} />
        <Sidebar 
          mobileOpen={mobileMenuOpen} 
          onClose={handleMenuClose}
          visible={sidebarVisible}
          onSidebarHide={handleSidebarHide}
        />

        <main className={`main-content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
          <Routes>
            <Route 
              path="/" 
              element={<Dashboard onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />} 
            />
            <Route 
              path="/logs" 
              element={<Logs onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />} 
            />
            <Route 
              path="/machine-list" 
              element={<MachineList onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />} 
            />
            <Route
              path="/equipment-insight"
              element={<EquipmentInsight onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />}
            />
            <Route
              path="/analytics"
              element={<Analytics onSidebarToggle={handleSidebarToggle} sidebarVisible={sidebarVisible} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
