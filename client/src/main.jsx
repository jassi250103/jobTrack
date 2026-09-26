import React from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext'; import { ToastProvider } from './context/ToastContext'; import { useAuth } from './hooks/useAuth'; import { LoadingState } from './components/ui'; import { AppLayout } from './components/layout'; import { Landing, Login, Register } from './pages/AuthPages'; import Dashboard from './pages/Dashboard'; import Applications, { ApplicationEditor } from './pages/Applications'; import ApplicationDetails from './pages/ApplicationDetails'; import Companies from './pages/Companies'; import Interviews from './pages/Interviews'; import Profile from './pages/Profile'; import './styles.css';

function ProtectedRoute({ children }) { const { user, loading } = useAuth(); if (loading) return <LoadingState />; return user ? children : <Navigate to="/login" replace />; }
function App() { return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}><Route path="/dashboard" element={<Dashboard />} /><Route path="/applications" element={<Applications />} /><Route path="/applications/new" element={<ApplicationEditor />} /><Route path="/applications/:id" element={<ApplicationDetails />} /><Route path="/applications/:id/edit" element={<ApplicationEditor edit />} /><Route path="/companies" element={<Companies />} /><Route path="/interviews" element={<Interviews />} /><Route path="/profile" element={<Profile />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}><App /></GoogleOAuthProvider>
          ) : (
            <App />
          )}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
