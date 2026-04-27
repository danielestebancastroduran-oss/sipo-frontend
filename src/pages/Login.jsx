import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { authFetch } from '../services/apiFetch'; // Importamos tu nuevo motor

const Login = () => {
  const [formData, setFormData] = useState({ correo: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usamos authFetch para el login
      const data = await authFetch('/usuarios/login', {
        method: 'POST',
        body: JSON.stringify({
          correo: formData.correo,
          password: formData.password
        })
      });

      console.log("Respuesta del servidor:", data);

      if (data && data.success) {
        // Guardamos el token y los datos de usuario
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        // Redirigimos al dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      console.error('Error en login:', err);
      // Aquí capturamos el error si authFetch lanza un throw new Error
      setError('Error de conexión con el servidor. Verifica que esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (Tu código JSX se mantiene IGUAL, no necesitas cambiar nada abajo)
    // ... dentro de tu Login.jsx, asegúrate de que el contenedor principal tenga esto:
    <div className="min-h-screen flex items-center justify-center bg-sipo-cream p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sipo-orange/5 rounded-bl-full"></div>
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-sipo-orange rounded-lg flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">S</div>
            <span className="text-2xl font-bold text-sipo-charcoal tracking-tight">SIPO</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-sipo-charcoal">¡Bienvenido de nuevo!</h2>
          <p className="text-gray-500 mt-2">Ingresa tus credenciales para acceder</p>
        </div>
        {/* Formulario */}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center animate-fade-in">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
              <input 
                type="email" 
                name="correo" 
                value={formData.correo} 
                onChange={handleChange} 
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange focus:ring-sipo-orange/20 outline-none transition-all"
                placeholder="[EMAIL_ADDRESS]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange focus:ring-sipo-orange/20 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={20} /> Iniciando sesión...</>
            ) : (
              <><CheckCircle2 size={20} /> Entrar al Sistema</>
            )}
          </button>
        </form>
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            ¿No tienes una cuenta? 
            <Link to="/register" className="text-sipo-orange font-bold hover:text-sipo-orange-dark ml-2 transition-colors">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;