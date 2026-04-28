import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Configuracion from './pages/Configuracion';
import ObrasList from './pages/Obras/ObrasList';
import Step1CrearObra from './pages/Obras/CreationFlow/Step1CrearObra';
import Step2Partidas from './pages/Obras/CreationFlow/Step2Partidas';
import Step3APU from './pages/Obras/CreationFlow/Step3APU';
import Step4Costos from './pages/Obras/CreationFlow/Step4Costos';
import Step5Presupuesto from './pages/Obras/CreationFlow/Step5Presupuesto';

// Componente para proteger rutas
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  console.log("🛡️ [DEBUG] ProtectedRoute - Token:", token ? "Existente" : "MISSING");
  return token ? <DashboardLayout><Outlet /></DashboardLayout> : <Navigate to="/login" />;
};

function App() {
  console.log("📍 [DEBUG] App.jsx renderizado en path:", window.location.pathname);
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/obras" element={<ObrasList />} />
          <Route path="/obras/nueva" element={<Step1CrearObra />} />
          <Route path="/obras/:id/editar" element={<Step1CrearObra />} />
          <Route path="/obras/:id/partidas" element={<Step2Partidas />} />
          <Route path="/obras/:id/apu" element={<Step3APU />} />
          <Route path="/obras/:id/partidas/:pid/apu" element={<Step3APU />} />
          <Route path="/obras/:id/costos" element={<Step4Costos />} />
          <Route path="/obras/:id/presupuesto" element={<Step5Presupuesto />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;