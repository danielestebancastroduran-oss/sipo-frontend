import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { 
  Briefcase, 
  Users, 
  Hammer, 
  Receipt, 
  Printer, 
  Save, 
  Upload, 
  Plus, 
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  Edit3,
  Info
} from 'lucide-react';
import { formatCOP, parseNum } from '../utils/format';
import Toast from '../components/Toast';

const Configuracion = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabInicial = searchParams.get('tab') || 'empresa';
  const [activeTab, setActiveTab] = useState(tabInicial);

  useEffect(() => {
    setActiveTab(tabInicial);
  }, [tabInicial]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(null);
  
  const [cuadrillas, setCuadrillas] = useState([]);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [empresa, setEmpresa] = useState({
    nombre_empresa: '',
    nit: '',
    correo: '',
    telefono: '',
    direccion: '',
    logo_url: ''
  });
  const [logoPreview, setLogoPreview] = useState('');

  const [retenciones, setRetenciones] = useState({
    retencion_fuente: 3.5,
    ica_porcentaje: 0.966,
    iva_porcentaje: 19
  });

  const [impresion, setImpresion] = useState({
    mostrarLogo: true,
    incluirAPUDetallado: false,
    desgloseAdministracion: true,
    datosCliente: true,
    retencionesAplicadas: true
  });

  const [recursos, setRecursos] = useState([]);

  const fetchData = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!user.id || !token) return;

    const authHeader = { 'Authorization': `Bearer ${token}` };

    try {
      setLoading(true);
      const [empRes, cuadRes, taxRes, recRes] = await Promise.all([
        fetch(`http://localhost:3000/api/empresa-config/usuario/${user.id}`, { headers: authHeader }),
        fetch(`http://localhost:3000/api/cuadrillas/usuario/${user.id}`, { headers: authHeader }),
        fetch(`http://localhost:3000/api/configuracion-fiscal/usuario/${user.id}`, { headers: authHeader }),
        fetch(`http://localhost:3000/api/recursos/usuario/${user.id}`, { headers: authHeader })
      ]);

      const empData = await empRes.json();
      const cuadData = await cuadRes.json();
      const taxData = await taxRes.json();
      const recData = await recRes.json();

      if (empData.success && empData.data) {
        setEmpresa(empData.data);
        if (empData.data.logo_url) setLogoPreview(empData.data.logo_url);
      }
      if (Array.isArray(cuadData.data)) setCuadrillas(cuadData.data);
      if (taxData.success && taxData.data) setRetenciones(taxData.data);
      if (Array.isArray(recData.data)) setRecursos(recData.data);
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const authHeaders = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const sanitizedEmpresa = {
        nombre_empresa: empresa?.nombre_empresa || '',
        nit: empresa?.nit || '',
        correo: empresa?.correo || '',
        telefono: empresa?.telefono || '',
        direccion: empresa?.direccion || '',
        logo_url: empresa?.logo_url || '',
        usuario_id: user.id
      };

      const sanitizedRetenciones = {
        retencion_fuente: Number(retenciones?.retencion_fuente || 0),
        ica_porcentaje: Number(retenciones?.ica_porcentaje || 0),
        iva_porcentaje: Number(retenciones?.iva_porcentaje || 19),
        usuario_id: user.id,
        nit: empresa?.nit || ''
      };

      const [resEmp, resTax] = await Promise.all([
        fetch(`http://localhost:3000/api/empresa-config/usuario/${user.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(sanitizedEmpresa)
        }),
        fetch(`http://localhost:3000/api/configuracion-fiscal/usuario/${user.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(sanitizedRetenciones)
        })
      ]);

      if (!resEmp.ok || !resTax.ok) {
        const errEmp = !resEmp.ok ? await resEmp.json() : null;
        const errTax = !resTax.ok ? await resTax.json() : null;
        console.error('❌ Error Empresa:', errEmp);
        console.error('❌ Error Retenciones:', errTax);
        throw new Error(errEmp?.message || errTax?.message || 'Error en el servidor');
      }

      setSuccess(true);
      setShowToast({ message: 'Configuración guardada correctamente', type: 'success' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setShowToast({ message: 'Error al guardar la configuración', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCrew = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
      alert('No estás autenticado. Inicia sesión nuevamente.');
      return;
    }

    const formData = new FormData(e.target);
    const nombreVal = formData.get('nombre')?.trim();
    const rendimientoVal = formData.get('rendimiento_base');

    if (!nombreVal) {
      alert('El nombre de la cuadrilla es requerido.');
      return;
    }

    // Payload alineado con CuadrillaCreateSchema del backend:
    // { usuario_id, nombre, rendimiento_base? }
    const payload = {
      usuario_id: user.id,
      nombre: nombreVal,
      descripcion: formData.get('descripcion')?.trim() || '',
      costo_diario: parseNum(formData.get('costo_diario')) || 0,
      ...(rendimientoVal ? { rendimiento_base: parseNum(rendimientoVal) } : {})
    };

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const url = editingCrew
        ? `http://localhost:3000/api/cuadrillas/${editingCrew.id}`
        : `http://localhost:3000/api/cuadrillas`;

      const res = await fetch(url, {
        method: editingCrew ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('📥 Respuesta cuadrilla:', data);

      if (data.success) {
        setShowCrewModal(false);
        setEditingCrew(null);
        // Recargar lista con token
        const refresh = await fetch(
          `http://localhost:3000/api/cuadrillas/usuario/${user.id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const rData = await refresh.json();
        // GET lista devuelve { data: [...] } sin 'success'
        if (Array.isArray(rData.data)) setCuadrillas(rData.data);
      } else {
        console.error('❌ Error backend:', data);
        alert('Error: ' + (data.message || JSON.stringify(data.errors || 'No se pudo guardar la cuadrilla')));
      }
    } catch (err) {
      console.error('❌ Error de red:', err);
      alert('Error de conexión. Verifica que el backend esté corriendo.');
    }
  };

  const handleDeleteCrew = async (id) => {
    if (!window.confirm('¿Eliminar esta cuadrilla?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/cuadrillas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCuadrillas(cuadrillas.filter(c => c.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('¿Eliminar este recurso del catálogo?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/recursos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRecursos(recursos.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleLogoChange = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('El logo no puede superar 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setLogoPreview(base64);
      setEmpresa(prev => ({ ...prev, logo_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'empresa', label: 'Mi empresa', icon: Briefcase },
    { id: 'cuadrillas', label: 'Cuadrillas', icon: Users },
    { id: 'materiales', label: 'Materiales', icon: Hammer }, // Reuso icono para simplicidad
    { id: 'retenciones', label: 'Retenciones', icon: Receipt },
    { id: 'impresion', label: 'Impresión', icon: Printer }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic uppercase">Configuración del Sistema</h1>
          <p className="text-sipo-slate text-sm">Personaliza los parámetros globales de tus presupuestos e identidad corporativa.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-sipo-carbon hover:bg-black text-white font-bold py-3 px-8 rounded-xl flex items-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} className="text-sipo-green" /> : <Save size={18} />}
          {success ? '¡Guardado!' : 'Guardar Preferencias'}
        </button>
      </header>

      {/* Navegación por Tabs */}
      <div className="flex gap-2 p-1.5 bg-white border border-sipo-border rounded-2xl w-fit shadow-sm overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-widest ${
              activeTab === tab.id 
                ? 'bg-sipo-carbon text-sipo-cream shadow-md scale-105' 
                : 'text-sipo-slate hover:bg-sipo-surface'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-sipo-border shadow-sm p-10 min-h-[500px]">
        {/* TAB: MI EMPRESA */}
        {activeTab === 'empresa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in">
             <div className="space-y-6">
                <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic uppercase border-b border-sipo-border pb-2">Datos Legales</h3>
                
                <div className="space-y-4">
                  <div>
                    <label>Nombre de la Empresa / Razón Social*</label>
                    <input type="text" value={empresa.nombre_empresa} onChange={e => setEmpresa({...empresa, nombre_empresa: e.target.value})} className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label>NIT*</label>
                      <input type="text" value={empresa.nit} onChange={e => setEmpresa({...empresa, nit: e.target.value})} className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm text-center" />
                    </div>
                    <div>
                      <label>Teléfono</label>
                      <input type="text" value={empresa.telefono} onChange={e => setEmpresa({...empresa, telefono: e.target.value})} className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm" />
                    </div>
                  </div>
                  <div>
                    <label>Correo electrónico</label>
                    <input type="email" value={empresa.correo} onChange={e => setEmpresa({...empresa, correo: e.target.value})} className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm" />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label>Dirección</label>
                      <input type="text" value={empresa.direccion} onChange={e => setEmpresa({...empresa, direccion: e.target.value})} className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm" />
                    </div>
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic uppercase border-b border-sipo-border pb-2">Identidad Visual</h3>
                <label>Logo de la empresa</label>
                 <div 
                   className="aspect-video w-full bg-sipo-surface border-2 border-dashed border-sipo-border rounded-3xl flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-sipo-orange transition-all overflow-hidden relative"
                   onDragOver={e => e.preventDefault()}
                   onDrop={e => { e.preventDefault(); handleLogoChange(e.dataTransfer.files[0]); }}
                 >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo empresa" className="max-h-full max-w-full object-contain p-4" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setLogoPreview(''); setEmpresa(prev => ({...prev, logo_url: ''})); }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700 transition-colors z-10"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="group-hover:scale-110 transition-transform flex flex-col items-center pointer-events-none">
                        <Upload size={40} className="text-sipo-slate-light group-hover:text-sipo-orange" />
                        <p className="text-[11px] uppercase font-bold text-sipo-slate-light mt-2 group-hover:text-sipo-orange">Arrastra tu logo aquí o haz clic</p>
                        <p className="text-[10px] text-gray-400 mt-1">PNG, JPG o SVG (Máx 2MB)</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={e => handleLogoChange(e.target.files[0])}
                    />
                 </div>
                <div className="bg-sipo-blue-bg/20 p-4 rounded-xl flex gap-3 items-start border border-sipo-blue/10">
                   <Info size={18} className="text-sipo-blue shrink-0" />
                   <p className="text-[11px] text-sipo-blue font-medium leading-relaxed">Este logo aparecerá en el encabezado de todos tus presupuestos generados y reportes PDF.</p>
                </div>
             </div>

             <div className="md:col-span-2 pt-10 border-t border-sipo-border flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-4 px-10 rounded-xl flex items-center gap-3 transition-all shadow-lg shadow-sipo-orange/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Guardar configuración de empresa
                </button>
             </div>
          </div>
        )}

        {/* TAB: CUADRILLAS */}
        {activeTab === 'cuadrillas' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex justify-between items-center bg-sipo-surface p-6 rounded-2xl">
               <div>
                  <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic uppercase">Administración de Cuadrillas</h3>
                  <p className="text-xs text-sipo-slate">Personaliza el costo día de tus grupos de trabajo.</p>
               </div>
               <button 
                  onClick={() => { setEditingCrew(null); setShowCrewModal(true); }}
                  className="bg-sipo-orange text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-sipo-orange-dark transition-all"
                >
                  <Plus size={16} /> Nueva Cuadrilla
               </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cuadrillas.map((c, i) => (
                  <div key={c.id} className="bg-white border border-sipo-border rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                     <div className={`h-2 w-full bg-sipo-orange`}></div>
                     <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                           <h4 className="font-bold text-sipo-carbon">{c.nombre}</h4>
                           <div className="flex gap-2">
                             <button className="text-sipo-blue p-1 hover:bg-sipo-blue-bg rounded-md transition-colors" onClick={() => { setEditingCrew(c); setShowCrewModal(true); }} title="Editar">
                               <Edit3 size={18}/>
                             </button>
                             <button className="text-sipo-red p-1 hover:bg-sipo-red-bg rounded-md transition-colors" onClick={() => handleDeleteCrew(c.id)} title="Eliminar">
                               <Trash2 size={18}/>
                             </button>
                           </div>
                        </div>
                        <p className="text-xs text-sipo-slate mb-4 line-clamp-2">{c.descripcion}</p>
                        <div className="mt-4 pt-4 flex justify-between items-center border-t border-gray-50">
                           <span className="text-[10px] font-bold text-sipo-orange uppercase italic">Costo Base / Día</span>
                           <span className="text-2xl font-barlow font-bold text-sipo-carbon">{formatCOP(c.costo_diario)}</span>
                        </div>
                     </div>
                  </div>
                ))}
                {cuadrillas.length === 0 && (
                  <div className="md:col-span-2 py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                     <Users size={48} className="mx-auto text-gray-200 mb-4" />
                     <p className="text-sipo-slate font-medium">No has registrado cuadrillas.</p>
                     <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Éstas son necesarias para tus cálculos de APU</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* TAB: MATERIALES / CATÁLOGO */}
        {(activeTab === 'materiales') && (
          <div className="animate-fade-in space-y-6">
             <div className="flex justify-between items-center bg-sipo-surface p-6 rounded-2xl">
               <div>
                  <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic uppercase">Catálogo Global de Recursos</h3>
                  <p className="text-xs text-sipo-slate">Gestiona tus materiales, herramientas y equipos registrados.</p>
               </div>
             </div>
             
             <div className="bg-white rounded-2xl border border-sipo-border overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-sipo-carbon text-white text-[10px] uppercase tracking-widest font-bold">
                   <tr>
                     <th className="px-6 py-4">Nombre</th>
                     <th className="px-6 py-4 text-center">Tipo</th>
                     <th className="px-6 py-4 text-center">Unidad</th>
                     <th className="px-6 py-4 text-right">Precio Unit.</th>
                     <th className="px-6 py-4 text-center">Acción</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-sipo-border">
                   {recursos.length === 0 ? (
                     <tr>
                       <td colSpan="5" className="py-20 text-center text-sipo-slate italic">Aún no tienes recursos registrados en el catálogo.</td>
                     </tr>
                   ) : (
                     recursos.map(r => (
                       <tr key={r.id} className="hover:bg-sipo-surface transition-colors group text-sm">
                         <td className="px-6 py-4 font-bold text-sipo-carbon">{r.nombre}</td>
                         <td className="px-6 py-4 text-center capitalize">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                             r.tipo === 'material' ? 'bg-blue-50 text-blue-600' : 
                             r.tipo === 'herramienta' ? 'bg-orange-50 text-orange-600' : 
                             'bg-green-50 text-green-600'
                           }`}>
                             {r.tipo}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-center font-medium text-sipo-slate">{r.unidad}</td>
                         <td className="px-6 py-4 text-right font-bold text-sipo-carbon">{formatCOP(r.precio_unitario)}</td>
                         <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleDeleteResource(r.id)}
                              className="text-sipo-red p-2 hover:bg-sipo-red-bg rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                               <Trash2 size={16} />
                            </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* TAB: RETENCIONES */}
        {activeTab === 'retenciones' && (
          <div className="animate-fade-in max-w-2xl mx-auto space-y-10 py-10">
             <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-sipo-orange-bg rounded-full flex items-center justify-center mx-auto mb-4">
                   <Receipt size={32} className="text-sipo-orange" />
                </div>
                <h3 className="font-barlow font-bold text-3xl text-sipo-carbon italic uppercase">Configuración Fiscal</h3>
                <p className="text-sipo-slate text-sm">Establece los porcentajes de ley para el cálculo de retenciones en la fuente.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'RETENCIÓN EN LA FUENTE', val: retenciones?.retencion_fuente || 0, key: 'retencion_fuente' },
                  { label: 'ICA (INDUSTRIA Y COMERCIO)', val: retenciones?.ica_porcentaje || 0, key: 'ica_porcentaje' },
                  { label: 'IVA (PARA UTILIDAD)', val: retenciones?.iva_porcentaje || 0, key: 'iva_porcentaje' }
                ].map(r => (
                  <div key={r.key} className="bg-sipo-surface p-6 rounded-2xl border border-sipo-border flex flex-col items-center">
                     <label className="text-center mb-4 leading-tight">{r.label}</label>
                     <div className="relative">
                        <input 
                          type="number" step="0.001" 
                          className="w-24 text-center bg-white border border-sipo-border p-3 rounded-xl font-bold text-xl outline-none focus:border-sipo-orange"
                          value={r.val}
                          onChange={e => setRetenciones({...retenciones, [r.key]: Number(e.target.value)})}
                        />
                        <span className="absolute -right-5 top-1/2 -translate-y-1/2 font-bold text-sipo-slate">%</span>
                     </div>
                  </div>
                ))}
             </div>

             <div className="bg-white p-8 rounded-2xl border border-sipo-border space-y-4">
                <label>Tipo de persona jurídica</label>
                <select className="w-full p-3 bg-sipo-surface border border-sipo-border rounded-xl font-medium outline-none">
                   <option>Persona Jurídica - Regimen Común</option>
                   <option>Persona Natural - Regimen Simplificado</option>
                   <option>Gran Contribuyente</option>
                </select>
                <div className="pt-4 flex items-center justify-between">
                   <span className="text-xs font-bold text-sipo-slate">RUT Actualizado (PDF)</span>
                   <button className="text-sipo-orange font-bold text-xs flex items-center gap-2 border border-sipo-orange px-4 py-2 rounded-lg hover:bg-sipo-orange hover:text-white transition-all">
                      <Upload size={14} /> Subir archivo
                   </button>
                </div>
             </div>
             <div className="pt-10 flex justify-center border-t border-sipo-border">
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-sipo-carbon hover:bg-black text-white font-bold py-4 px-12 rounded-xl flex items-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  <Save size={20} className="text-sipo-orange" />
                  Guardar configuración fiscal
                </button>
              </div>
          </div>
        )}

        {/* TAB: IMPRESIÓN */}
        {activeTab === 'impresion' && (
          <div className="animate-fade-in max-w-xl mx-auto py-10 space-y-8">
             <div className="flex items-center gap-4 bg-sipo-carbon p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
                <Printer size={48} className="text-sipo-orange opacity-40 absolute -right-2 -bottom-2 scale-150" />
                <div className="relative z-10">
                   <h3 className="font-barlow font-bold text-xl uppercase italic">Preferencias de Exportación</h3>
                   <p className="text-sipo-slate-light text-[11px] uppercase tracking-widest font-bold">Configura cómo se verá tu oferta comercial</p>
                </div>
             </div>

             <div className="space-y-4 divide-y divide-gray-100">
                {[
                  { label: 'Mostrar logo de empresa en el encabezado', key: 'mostrarLogo' },
                  { label: 'Incluir desglose de APU detallado', key: 'incluirAPUDetallado' },
                  { label: 'Incluir desglose administrativo en AIU', key: 'desgloseAdministracion' },
                  { label: 'Mostrar datos completos del cliente', key: 'datosCliente' },
                  { label: 'Incluir cálculo preliminar de retenciones', key: 'retencionesAplicadas' }
                ].map(opt => (
                  <div key={opt.key} className="flex justify-between items-center py-4 px-2 hover:bg-sipo-surface transition-colors rounded-lg group">
                    <span className="text-sipo-carbon font-medium group-hover:text-sipo-orange transition-colors">{opt.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={impresion[opt.key]} onChange={() => setImpresion({...impresion, [opt.key]: !impresion[opt.key]})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sipo-orange"></div>
                    </label>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
      
      {/* Modal Nueva/Editar Cuadrilla */}
      {showCrewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sipo-carbon/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <header className="bg-sipo-carbon p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="font-barlow font-bold text-xl uppercase italic">
                  {editingCrew ? 'Editar Cuadrilla' : 'Nueva Cuadrilla'}
                </h3>
              </div>
              <button onClick={() => setShowCrewModal(false)}><X size={24} /></button>
            </header>
            <form onSubmit={handleCreateCrew} className="p-8 space-y-6">
              <input type="hidden" name="id" value={editingCrew?.id || ''} />
              <div>
                <label>Nombre de la cuadrilla</label>
                <input
                  name="nombre"
                  type="text"
                  defaultValue={editingCrew?.nombre}
                  required
                  placeholder="Ej. Cuadrilla de mampostería"
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm"
                />
              </div>
              <div>
                <label>Descripción <span className="text-sipo-slate text-xs">(opcional)</span></label>
                <textarea
                  name="descripcion"
                  defaultValue={editingCrew?.descripcion}
                  placeholder="Ej. Personal encargado de muros y acabados"
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm resize-none"
                  rows="2"
                />
              </div>
              <div>
                <label>Costo Diario (Sueldo)</label>
                <input
                  name="costo_diario"
                  type="number"
                  defaultValue={editingCrew?.costo_diario || 0}
                  required
                  placeholder="Ej. 120000"
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm"
                />
              </div>
              <div>
                <label>Rendimiento base <span className="text-sipo-slate text-xs">(opcional)</span></label>
                <input
                  name="rendimiento_base"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingCrew?.rendimiento_base || ''}
                  placeholder="Ej. 8.5"
                  className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-sm"
                />
              </div>
              <button type="submit" className="w-full bg-sipo-orange text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">
                {editingCrew ? 'Actualizar' : 'Crear Cuadrilla'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
    </div>
  );
};

export default Configuracion;
