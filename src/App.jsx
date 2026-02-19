import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import DashboardFlow from './pages/DashboardFlow';
import Analytics from './pages/Analytics';
import CalendarPage from './pages/Calendar';
import Configuration from './pages/Configuration';
import Invoices from './pages/Invoices';
import DailySales from './pages/DailySales';
import ImportAssistant from './pages/ImportAssistant';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardFlow />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="daily-sales" element={<DailySales />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="import-assistant" element={<ImportAssistant />} />
            <Route path="settings" element={<Configuration />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
