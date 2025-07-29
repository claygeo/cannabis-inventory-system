import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './contexts/AuthContext.jsx';
import { InventoryProvider } from './contexts/InventoryContext.jsx';
import { SessionProvider } from './contexts/SessionContext.jsx';

// Components
import Layout from './components/Layout/Layout.jsx';
import LoginForm from './components/Auth/LoginForm.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import MainDashboard from './components/Dashboard/MainDashboard.jsx';
import ImportForm from './components/Import/ImportForm.jsx';
import SweedImportForm from './components/Import/SweedImportForm.jsx';
import ScanningForm from './components/Scanning/ScanningForm.jsx';
import LabelGenerationForm from './components/Labels/LabelGenerationForm.jsx';
import ReportsForm from './components/Reports/ReportsForm.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';

// Styles
import './styles/App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InventoryProvider>
          <SessionProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginForm />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<MainDashboard />} />
                      <Route path="import" element={<ImportForm />} />
                      {/* FIXED: Changed from "import-sweed" to "sweed-import" to match navigation links */}
                      <Route path="sweed-import" element={<SweedImportForm />} />
                      <Route path="scanning" element={<ScanningForm />} />
                      <Route path="labels" element={<LabelGenerationForm />} />
                      <Route path="reports" element={<ReportsForm />} />
                    </Route>
                  </Route>
                  
                  {/* Catch all redirect */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                
                {/* 
                  REMOVED: Duplicate Toaster component that was causing conflicts
                  Toast notifications are now handled exclusively in Layout.jsx
                */}
              </div>
            </Router>
          </SessionProvider>
        </InventoryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;