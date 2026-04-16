import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AuthProvider from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { ConfirmationProvider } from '@/context/ConfirmationContext';
import ThemeProvider from '@/context/ThemeContext';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import PrivateRoute from '@/routes/PrivateRoute';
import PublicRoute from '@/routes/PublicRoute';

function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <ConfirmationProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ConfirmationProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
