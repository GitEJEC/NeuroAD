import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { AuthProvider, RequireAuth } from './auth/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';

const theme = createTheme({
  fontFamily: 'Lexend, sans-serif',
  headings: { fontFamily: 'Lexend, sans-serif' },
  primaryColor: 'indigo',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Patients />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
