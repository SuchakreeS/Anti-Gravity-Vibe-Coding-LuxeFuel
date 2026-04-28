import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterOrganization from './pages/RegisterOrganization';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MileageLog from './pages/MileageLog';
import AdminPanel from './pages/AdminPanel';
import AdminRoute from './components/AdminRoute';
import { CyberToastProvider } from './components/CyberToast';

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <CyberToastProvider>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-org" element={<RegisterOrganization />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mileage-log" element={<MileageLog />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Route>
      </Routes>
    </CyberToastProvider>
  );
}

export default App;
