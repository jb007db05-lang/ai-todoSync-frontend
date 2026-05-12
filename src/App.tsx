import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';

import AuthProvider from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { ConfirmationProvider } from '@/context/ConfirmationContext';
import PrivateRoute from '@/routes/PrivateRoute';
import PublicRoute from '@/routes/PublicRoute';
import Loader from '@/components/Loader';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));

import { LoadingProvider } from '@/context/LoadingContext';
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner';
import { ToastProvider } from '@/context/ToastContext';

function App(): JSX.Element {
  return (
    <ToastProvider>
      <LoadingProvider>
        <AuthProvider>
          <ChatProvider>
            <ConfirmationProvider>
              <BrowserRouter>
                <Suspense fallback={<Loader center />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
                    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/intelligence" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/event-tracking" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/sdk-docs" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/projects/:projectId" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/projects/:projectId/epics/:epicId" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              <GlobalLoadingSpinner />
            </ConfirmationProvider>
          </ChatProvider>
        </AuthProvider>
      </LoadingProvider>
    </ToastProvider>
  );
}

export default App;
