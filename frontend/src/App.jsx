import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute, RootRedirect } from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from './components/AdminLayout';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import LivePage from './pages/LivePage';
import MapPage from './pages/MapPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import AdminAnalysesPage from './pages/AdminAnalysesPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import SettingsPage from './pages/SettingsPage';
import PublicReportPage from './pages/PublicReportPage';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div style={{ position: 'fixed', top: 20, right: 30, zIndex: 9999 }}>
            <ThemeToggle />
          </div>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/admin/login" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/public/report/:qrToken" element={<PublicReportPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LivePage /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminPage />} />
            <Route path="analyses" element={<AdminAnalysesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
