import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const isAuthenticated = () => !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas dentro del DashboardLayout */}
        <Route 
          path="/" 
          element={isAuthenticated() ? <DashboardLayout /> : <Navigate to="/login" />}
        >
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="obras" element={<ObrasList />} />
          <Route path="obras/nueva" element={<Step1CrearObra />} />
          <Route path="obras/:id/editar" element={<Step1CrearObra />} />
          <Route path="obras/:id/partidas" element={<Step2Partidas />} />
          <Route path="obras/:id/partidas/:pid/apu" element={<Step3APU />} />
          <Route path="obras/:id/apu" element={<Step3APU />} />
          <Route path="obras/:id/costos" element={<Step4Costos />} />
          <Route path="obras/:id/presupuesto" element={<Step5Presupuesto />} />
          <Route path="configuracion" element={<Configuracion />} />
          
          {/* Redirigir / a /dashboard si está autenticado */}
          <Route path="" element={<Navigate to="/dashboard" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;