import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    confirmPassword: '',
    rol: 'ingeniero'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          password: formData.password,
          rol: formData.rol
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        navigate('/login');
      } else {
        setError(data.message || 'Error al registrar el usuario.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sipo-cream p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-sipo-orange/5 rounded-br-full"></div>
        
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-sipo-orange rounded-lg flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">S</div>
            <span className="text-2xl font-bold text-sipo-charcoal tracking-tight">SIPO</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-sipo-charcoal">Crea tu cuenta</h2>
          <p className="text-gray-500 mt-2">Únete a la gestión inteligente de obras</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange outline-none transition-all"
                placeholder="Juan"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange outline-none transition-all"
                placeholder="Pérez"
                value={formData.apellido}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              name="correo"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange outline-none transition-all"
              placeholder="juan@ejemplo.com"
              value={formData.correo}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Rol en la Obra</label>
            <select
              name="rol"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange outline-none transition-all bg-white"
              value={formData.rol}
              onChange={handleChange}
            >
              <option value="ingeniero">Ingeniero</option>
              <option value="arquitecto">Arquitecto</option>
              <option value="residente">Residente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange outline-none transition-all"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sipo-orange outline-none transition-all"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sipo-orange text-white py-4 mt-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Procesando...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-sipo-charcoal font-bold hover:underline">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
