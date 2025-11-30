import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardMorador from './pages/DashboardMorador';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return usuario ? children : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { usuario, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!usuario) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return children;
};

function App() {
  const { usuario, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} /> : <Login />} />
      <Route path="/registrar" element={usuario ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} /> : <Registrar />} />

      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <DashboardAdmin />
          </AdminRoute>
        }
      />

      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <DashboardMorador />
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to={usuario ? (isAdmin ? "/admin" : "/dashboard") : "/login"} />} />
    </Routes>
  );
}

export default App;
