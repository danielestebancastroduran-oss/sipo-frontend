import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Factory, Store, Home as HomeIcon, ArrowRight, User, Info, Loader2 } from 'lucide-react';
import TabProgreso from '../../../components/TabProgreso';

const Step1CrearObra = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'residencial',
    nombre: '',
    municipio_id: '',
    departamento_id: '',
    fecha_inicio: '',
    descripcion: '',
    cliente_nombre: '',
    cliente_nit: '',
    cliente_correo: '',
    cliente_telefono: ''
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [errorLocalizaciones, setErrorLocalizaciones] = useState(null);
  const [loadingMunis, setLoadingMunis] = useState(false);

  // Estados para Clientes
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');

  // 1. Cargar departamentos al montar el componente
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('SIPO Debug - Iniciando fetch de departamentos...');
        
        const res = await fetch('http://localhost:3000/api/departamentos', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const responseData = await res.json();
        console.log('SIPO Debug - Respuesta departamentos:', responseData);

        // El backend devuelve { data: [...], pagination: {...} }
        // No tiene campo "success: true" en el helper de paginación
        if (responseData.data) {
          setDepartamentos(responseData.data);
          setErrorLocalizaciones(null);
        } else {
          setErrorLocalizaciones('No se pudieron cargar los departamentos.');
        }
      } catch (err) {
        console.error('SIPO Error - Fetch Departamentos:', err);
        setErrorLocalizaciones('Error de conexión al cargar departamentos.');
      }
    };
    fetchDepartamentos();
  }, []);

  // 1.5 Cargar clientes existentes del usuario
  useEffect(() => {
    const fetchClientes = async () => {
      if (!user.id) return;
      setLoadingClientes(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/clientes/usuario/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.data) {
          setClientes(data.data);
          // Si hay clientes, por defecto mostramos el selector
          if (data.data.length > 0) setIsNewClient(false);
          else setIsNewClient(true);
        }
      } catch (err) {
        console.error('Error cargando clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };
    fetchClientes();
  }, [user.id]);

  // 2. Cargar municipios cuando cambie el departamento seleccionado
  useEffect(() => {
    const fetchMunicipios = async () => {
      if (!formData.departamento_id) {
        setMunicipios([]);
        return;
      }

      setLoadingMunis(true);
      try {
        const token = localStorage.getItem('token');
        console.log(`SIPO Debug - Iniciando fetch de municipios para Dept ID: ${formData.departamento_id}`);
        
        const res = await fetch(`http://localhost:3000/api/municipios/departamento/${formData.departamento_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const responseData = await res.json();
        console.log('SIPO Debug - Respuesta municipios:', responseData);

        if (responseData.data) {
          setMunicipios(responseData.data);
          setErrorLocalizaciones(null);
        } else {
          setMunicipios([]);
          setErrorLocalizaciones('No se encontraron municipios para este departamento.');
        }
      } catch (err) {
        console.error('SIPO Error - Fetch Municipios:', err);
        setErrorLocalizaciones('Error al cargar municipios del departamento.');
      } finally {
        setLoadingMunis(false);
      }
    };

    fetchMunicipios();
  }, [formData.departamento_id]);

  // Manejador simple para cambio de departamento
  const handleDeptChange = (e) => {
    const deptId = e.target.value;
    setFormData({ 
      ...formData, 
      departamento_id: deptId,
      municipio_id: '' // Limpiamos municipio al cambiar departamento
    });
  };

  const projectTypes = [
    { id: 'residencial', label: 'Residencial', icon: HomeIcon },
    { id: 'industrial', label: 'Industrial', icon: Factory },
    { id: 'comercial', label: 'Comercial', icon: Store },
    { id: 'remodelacion', label: 'Remodelación', icon: Building2 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let cliente_id = selectedClientId;

      // 1. Si es un cliente nuevo, debemos registrarlo PRIMERO
      if (isNewClient) {
        console.log('SIPO Debug - Registrando nuevo cliente antes de la obra...');
        const clientPayload = {
          usuario_id: user.id,
          nombre: formData.cliente_nombre,
          nit: formData.cliente_nit,
          correo: formData.cliente_correo,
          telefono: formData.cliente_telefono
        };

        const resClient = await fetch('http://localhost:3000/api/clientes', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(clientPayload)
        });

        const clientData = await resClient.json();
        if (clientData.success) {
          cliente_id = clientData.data.id;
          console.log('SIPO Debug - Cliente creado con ID:', cliente_id);
        } else {
          throw new Error(clientData.message || 'Error al crear el cliente');
        }
      }

      // 2. Ahora creamos la obra vinculada al cliente_id obtenido
      const payload = {
        ...formData,
        usuario_id: user.id,
        cliente_id: cliente_id || null, // Vinculamos el cliente (null si no hay selección)
        fecha_inicio: formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : null, // Formato ISO para Zod .datetime()
        estado: 'borrador'
      };

      const url = id 
        ? `http://localhost:3000/api/obras/${id}` 
        : 'http://localhost:3000/api/obras';

      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('obraActivaId', data.data.id);
        navigate(`/obras/${data.data.id}/partidas`);
      } else {
        const errorMsg = data.errors ? data.errors.join('\n') : (data.message || 'Error al guardar la obra');
        alert('Error de validación:\n' + errorMsg);
      }
    } catch (err) {
      console.error('Error en el flujo de registro:', err);
      alert(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <TabProgreso currentStep={1} />
      
      <div className="max-w-4xl mx-auto space-y-10">
        <header>
          <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic">CONFIGURACIÓN INICIAL</h1>
          <p className="text-sipo-slate text-sm">Define los parámetros básicos de tu nuevo proyecto de construcción.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Sección 1: Tipo de Proyecto */}
          <section className="space-y-4">
            <label>Tipo de proyecto</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {projectTypes.map((type) => (
                <div 
                  key={type.id}
                  onClick={() => setFormData({ ...formData, tipo: type.id })}
                  className={`p-6 bg-white border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center gap-3 ${
                    formData.tipo === type.id 
                      ? 'border-sipo-orange bg-sipo-orange-bg/10 shadow-lg shadow-sipo-orange/5' 
                      : 'border-sipo-border hover:border-sipo-orange/50 hover:bg-sipo-surface'
                  }`}
                >
                  <type.icon size={32} className={formData.tipo === type.id ? 'text-sipo-orange' : 'text-sipo-slate-light'} />
                  <span className={`text-sm font-bold ${formData.tipo === type.id ? 'text-sipo-orange' : 'text-sipo-slate'}`}>
                    {type.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Sección 2: Información del Proyecto */}
          <section className="bg-white p-8 rounded-2xl border border-sipo-border shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-sipo-orange" />
              <h3 className="font-barlow font-bold text-lg text-sipo-carbon tracking-wide uppercase italic">Información del proyecto</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label>Nombre del proyecto*</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Edificio Residencial Las Palmas"
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div>
                <label>Departamento*</label>
                <select 
                  required
                  className={`w-full mt-2 p-3 bg-sipo-surface border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium appearance-none ${
                    errorLocalizaciones ? 'border-red-500' : 'border-sipo-border'
                  }`}
                  value={formData.departamento_id}
                  onChange={handleDeptChange}
                >
                  <option value="">Seleccionar departamento</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
                {errorLocalizaciones && (
                  <p className="text-[10px] text-red-500 font-bold mt-1 uppercase italic">{errorLocalizaciones}</p>
                )}
              </div>

              <div>
                <label>Ciudad de la obra*</label>
                <div className="relative">
                  <select 
                    required
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                    value={formData.municipio_id}
                    onChange={(e) => setFormData({ ...formData, municipio_id: e.target.value })}
                    disabled={!formData.departamento_id || loadingMunis}
                  >
                    <option value="">
                      {loadingMunis ? 'Cargando municipios...' : 'Seleccionar ciudad'}
                    </option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  {loadingMunis && (
                    <div className="absolute right-10 top-[60%] -translate-y-1/2">
                       <span className="flex h-2 w-2">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sipo-orange opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-sipo-orange"></span>
                       </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label>Fecha de inicio</label>
                <input 
                  type="date" 
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label>Descripción</label>
                <textarea 
                  rows="3"
                  placeholder="Describe brevemente el alcance del proyecto..."
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium resize-none"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Sección 3: Datos del Cliente */}
          <section className="bg-white p-8 rounded-2xl border border-sipo-border shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <User size={18} className="text-sipo-orange" />
                <h3 className="font-barlow font-bold text-lg text-sipo-carbon tracking-wide uppercase italic">Datos del cliente</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsNewClient(!isNewClient)}
                className="text-[10px] font-bold uppercase tracking-widest text-sipo-orange border border-sipo-orange px-3 py-1 rounded-lg hover:bg-sipo-orange hover:text-white transition-all"
              >
                {isNewClient ? 'Seleccionar existente' : '+ Registrar nuevo'}
              </button>
            </div>

            {!isNewClient ? (
              <div className="space-y-4">
                <label>Selecciona un cliente de tu lista*</label>
                <select 
                  required={!isNewClient}
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium appearance-none"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">-- Buscar cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.nit})</option>
                  ))}
                </select>
                {clientes.length === 0 && !loadingClientes && (
                  <p className="text-[10px] text-gray-400 italic">No tienes clientes registrados aún. Usa "+ Registrar nuevo".</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                <div>
                  <label>Nombre o razón social*</label>
                  <input 
                    type="text" 
                    required={isNewClient}
                    placeholder="Ej: Inversiones Globales SAS"
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium"
                    value={formData.cliente_nombre}
                    onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label>NIT del cliente*</label>
                  <input 
                    type="text" 
                    required={isNewClient}
                    placeholder="900.000.000-0"
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium"
                    value={formData.cliente_nit}
                    onChange={(e) => setFormData({ ...formData, cliente_nit: e.target.value })}
                  />
                </div>
                <div>
                  <label>Correo electrónico</label>
                  <input 
                    type="email" 
                    placeholder="cliente@ejemplo.com"
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium"
                    value={formData.cliente_correo}
                    onChange={(e) => setFormData({ ...formData, cliente_correo: e.target.value })}
                  />
                </div>
                <div>
                  <label>Teléfono</label>
                  <input 
                    type="tel" 
                    placeholder="300 000 0000"
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all font-medium"
                    value={formData.cliente_telefono}
                    onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                  />
                </div>
              </div>
            )}
          </section>

          <footer className="flex justify-end pt-6">
            <button 
              type="submit"
              disabled={loading}
              className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-4 px-10 rounded-xl flex items-center gap-3 transition-all shadow-lg shadow-sipo-orange/20 active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Guardar y continuar
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default Step1CrearObra;
