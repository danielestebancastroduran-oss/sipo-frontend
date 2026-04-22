import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Save,
  Package,
  Hammer,
  Truck,
  Info,
  Loader2,
  Check,
  X,
  Wrench,
  Users
} from 'lucide-react';
import TabProgreso from '../../../components/TabProgreso';
import { formatCOP, parseNum } from '../../../utils/format';
import Toast from '../../../components/Toast';

const Step3APU = () => {
  const navigate = useNavigate();
  const { id, pid } = useParams();
  const [loading, setLoading] = useState(true);
  const [partida, setPartida] = useState(null);
  const [obra, setObra] = useState(null);
  const [showToast, setShowToast] = useState(null);
  
  // Estados para las 4 secciones
  const [materiales, setMateriales] = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [selectedCuadrilla, setSelectedCuadrilla] = useState(null);
  const [rendimiento, setRendimiento] = useState(1);

  // Inline Row State
  const [newItem, setNewItem] = useState({ tipo: null, nombre: '', unidad: '', cantidad: 0, precio: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [obraRes, partidaRes, cuadrillasRes] = await Promise.all([
        fetch(`http://localhost:3000/api/obras/${id}`),
        fetch(`http://localhost:3000/api/partidas/${pid}`),
        fetch(`http://localhost:3000/api/cuadrillas/usuario/${JSON.parse(localStorage.getItem('user'))?.id}`)
      ]);

      const oData = await obraRes.json();
      const pData = await partidaRes.json();
      const cData = await cuadrillasRes.json();
      console.log('SIPO Debug - Cuadrillas cargadas:', cData);

      if (oData.success) setObra(oData.data);
      if (pData.success) {
        setPartida(pData.data);
        if (pData.data.apu_detalles) {
          // Filtrar por recurso -> tipo
          setMateriales(pData.data.apu_detalles.filter(d => d.recursos?.tipo === 'material'));
          setHerramientas(pData.data.apu_detalles.filter(d => d.recursos?.tipo === 'herramienta'));
          setEquipos(pData.data.apu_detalles.filter(d => d.recursos?.tipo === 'equipo'));
          
          const cDetalle = pData.data.apu_detalles.find(d => d.cuadrillas);
          if (cDetalle) {
            setSelectedCuadrilla(cDetalle.cuadrillas);
            setRendimiento(cDetalle.rendimiento || 1);
          }
        }
      }
      if (cData.success) setCuadrillas(cData.data || []);
    } catch (err) {
      console.error('Error cargando APU:', err);
    } finally {
      setLoading(false);
    }
  };

  // Si no hay pid en la URL, redirigir a la primera partida
  useEffect(() => {
    if (!pid && id) {
      fetch(`http://localhost:3000/api/obras/${id}/partidas`)
        .then(r => r.json())
        .then(data => {
          const partidas = data.data?.partidas || data.data || [];
          if (partidas.length > 0) {
            navigate(`/obras/${id}/partidas/${partidas[0].id}/apu`, { replace: true });
          } else {
            navigate(`/obras/${id}/partidas`, { replace: true });
          }
        });
    }
  }, [pid, id, navigate]);

  useEffect(() => {
    if (id && pid) {
      localStorage.setItem('obraActivaId', id);
      fetchData();
    }
  }, [id, pid]);

  const handleAddItem = async (tipo) => {
    if (!newItem.nombre || !newItem.unidad) {
      alert('Completa al menos el nombre y la unidad');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/obras/${id}/partidas/${pid}/apu/${tipo}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: newItem.nombre,
            unidad: newItem.unidad,
            cantidad: Number(newItem.cantidad) || 0,
            precio_unitario: Number(newItem.precio) || 0
          })
        }
      );
      const data = await response.json();
      console.log('SIPO Debug - Respuesta agregar ítem:', data);
      if (data.success) {
        setNewItem({ tipo: null, nombre: '', unidad: '', cantidad: 0, precio: 0 });
        fetchData();
      } else {
        alert('Error: ' + (data.message || 'No se pudo guardar'));
      }
    } catch (err) {
      console.error('Error agregando ítem:', err);
      alert('Error de conexión al guardar el ítem');
    }
  };

  const handleRemove = async (recursoId) => {
    if (!recursoId) {
      console.error('SIPO Debug - recursoId es undefined');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/obras/${id}/partidas/${pid}/apu/recurso/${recursoId}`,
        { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      console.log('SIPO Debug - Respuesta eliminar:', data);
      if (data.success) {
        fetchData();
      } else {
        alert('Error al eliminar: ' + (data.message || 'Error desconocido'));
      }
    } catch (err) {
      console.error('Error eliminando ítem:', err);
    }
  };

  const handleSaveAPU = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/obras/${id}/partidas/${pid}/apu`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cuadrilla_id: selectedCuadrilla?.id || null,
            rendimiento: Number(rendimiento) || 1
          })
        }
      );
      const data = await response.json();
      console.log('SIPO Debug - Respuesta guardar APU:', data);
      
      // Navegar SIEMPRE al siguiente paso, haya o no error
      // El APU puede guardarse parcialmente y continuar
      if (data.success || response.ok) {
        setShowToast({ message: 'APU guardado correctamente ✓', type: 'success' });
        setTimeout(() => navigate(`/obras/${id}/costos`), 1000);
      } else {
        // Si falla el guardado, preguntar si igual quiere continuar
        const continuar = window.confirm(
          'No se pudo guardar el APU en el servidor. ¿Continuar al siguiente paso de todos modos?'
        );
        if (continuar) navigate(`/obras/${id}/costos`);
      }
    } catch (err) {
      console.error('Error guardando APU:', err);
      const continuar = window.confirm(
        'Error de conexión. ¿Continuar al siguiente paso de todos modos?'
      );
      if (continuar) navigate(`/obras/${id}/costos`);
    }
  };

  // Cálculos
  const totalMateriales = materiales.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  const totalHerramientas = herramientas.reduce((sum, item) => sum + (item.cantidad * item.costo_uso), 0);
  const totalEquipos = equipos.reduce((sum, item) => sum + (item.cantidad * item.costo), 0);
  
  const costoCuadrillaUnidad = selectedCuadrilla ? (selectedCuadrilla.costo_diario / rendimiento) : 0;
  
  const totalAPUUnidad = totalMateriales + totalHerramientas + totalEquipos + costoCuadrillaUnidad;

  const TableHeader = ({ icon: Icon, title, onAdd }) => (
    <div className="bg-sipo-carbon p-4 flex justify-between items-center rounded-t-xl">
      <div className="flex items-center gap-3 text-sipo-cream">
        <Icon size={20} className="text-sipo-orange" />
        <h3 className="font-barlow font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <button 
        onClick={onAdd}
        className="text-[10px] uppercase font-bold text-sipo-orange hover:text-white flex items-center gap-1 transition-colors"
      >
        <Plus size={14} />
        Agregar ítem
      </button>
    </div>
  );

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-sipo-orange" size={40} /></div>;

  return (
    <div className="animate-fade-in pb-20">
      <TabProgreso currentStep={3} />

      <div className="max-w-[1200px] mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <Link to={`/obras/${id}/partidas`} className="text-xs font-bold text-sipo-orange flex items-center gap-1 mb-2 hover:underline">
              <ChevronLeft size={14} /> Volver al listado
            </Link>
            <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic uppercase">Análisis de Precio Unitario (APU)</h1>
          </div>
          <button 
            onClick={handleSaveAPU}
            className="bg-sipo-green hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-sipo-green/20"
          >
            <Save size={18} />
            Guardar APU
          </button>
        </header>

        {/* Tarjetas de Contexto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Partida', value: partida?.nombre, detail: 'ID: ' + pid },
            { label: 'Unidad', value: partida?.unidad || 'm2', detail: 'Medida base' },
            { label: 'Cantidad en obra', value: partida?.cantidad || 0, detail: 'Total proyecto' },
            { label: 'Costo por unidad', value: formatCOP(totalAPUUnidad), detail: 'Calculado', highlight: true }
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-sipo-border border-t-[3px] border-t-sipo-orange shadow-sm">
              <p className="text-[10px] uppercase text-sipo-slate font-bold tracking-wider">{card.label}</p>
              <h4 className={`text-xl font-barlow font-bold mt-1 truncate ${card.highlight ? 'text-sipo-orange' : 'text-sipo-carbon'}`}>
                {card.value}
              </h4>
              <p className="text-[10px] text-sipo-slate-light mt-1">{card.detail}</p>
            </div>
          ))}
        </div>

        {/* Tablas de APU */}
        <div className="space-y-10">
          
          {/* MATERIALES */}
          <section className="bg-white rounded-xl border border-sipo-border shadow-sm overflow-hidden">
            <TableHeader icon={Package} title="Materiales" onAdd={() => setNewItem({tipo: 'materiales', nombre: '', unidad: '', cantidad: 0, precio: 0})} />
            <table className="w-full text-left text-[13px]">
              <thead className="bg-sipo-surface border-b border-sipo-border">
                <tr className="text-[10px] uppercase font-bold text-sipo-slate">
                  <th className="px-6 py-3">Recurso</th>
                  <th className="px-6 py-3 text-center">Unidad</th>
                  <th className="px-6 py-3 text-right">Cantidad</th>
                  <th className="px-6 py-3 text-right">Precio Unit.</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                  <th className="px-6 py-3 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {materiales.length === 0 && newItem.tipo !== 'materiales' ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-sipo-slate-light italic">No hay materiales agregados</td></tr>
                ) : (
                  <>
                    {materiales.map((m, i) => (
                      <tr key={i} className="hover:bg-sipo-surface">
                        <td className="px-6 py-3 font-medium">{m.recursos?.nombre}</td>
                        <td className="px-6 py-3 text-center">{m.recursos?.unidad}</td>
                        <td className="px-6 py-3 text-right">{m.cantidad}</td>
                        <td className="px-6 py-3 text-right">{formatCOP(m.precio_unitario)}</td>
                        <td className="px-6 py-3 text-right font-bold">{formatCOP(parseNum(m.cantidad) * parseNum(m.precio_unitario))}</td>
                        <td className="px-6 py-3 text-center">
                          <button 
                            onClick={() => handleRemove(m.recurso_id)}
                            className="text-sipo-red hover:bg-sipo-red-bg p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {newItem.tipo === 'materiales' && (
                      <tr className="bg-sipo-orange-bg/10 animate-fade-in">
                        <td className="px-4 py-2"><input className="w-full p-2 rounded" placeholder="Nombre..." value={newItem.nombre} onChange={e => setNewItem({...newItem, nombre: e.target.value})} /></td>
                        <td className="px-4 py-2 w-20"><input className="w-full p-2 rounded text-center" placeholder="Und" value={newItem.unidad} onChange={e => setNewItem({...newItem, unidad: e.target.value})} /></td>
                        <td className="px-4 py-2 w-24"><input type="number" className="w-full p-2 rounded text-right" value={newItem.cantidad} onChange={e => setNewItem({...newItem, cantidad: e.target.value})} /></td>
                        <td className="px-4 py-2 w-32"><input type="number" className="w-full p-2 rounded text-right" value={newItem.precio} onChange={e => setNewItem({...newItem, precio: e.target.value})} /></td>
                        <td className="px-4 py-2 text-right font-bold">{formatCOP(newItem.cantidad * newItem.precio)}</td>
                        <td className="px-4 py-2 flex gap-2">
                           <button onClick={() => handleAddItem('materiales')} className="p-2 text-sipo-green"><Check size={18}/></button>
                           <button onClick={() => setNewItem({tipo:null})} className="p-2 text-sipo-red"><X size={18}/></button>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </section>

          {/* HERRAMIENTAS */}
          <section className="bg-white rounded-xl border border-sipo-border shadow-sm overflow-hidden animate-fade-in">
            <TableHeader icon={Wrench} title="Herramientas" onAdd={() => setNewItem({tipo: 'herramientas', nombre: '', unidad: '', cantidad: 0, precio: 0})} />
            <table className="w-full text-left text-[13px]">
              <thead className="bg-sipo-surface border-b border-sipo-border">
                <tr className="text-[10px] uppercase font-bold text-sipo-slate">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3 text-center">Unidad</th>
                  <th className="px-6 py-3 text-right">Cantidad</th>
                  <th className="px-6 py-3 text-right">V. Unit</th>
                  <th className="px-6 py-3 text-right text-sipo-orange">Subtotal</th>
                  <th className="px-6 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {herramientas.length === 0 && newItem.tipo !== 'herramientas' ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-sipo-slate-light italic">No hay herramientas agregadas</td></tr>
                ) : (
                  <>
                    {herramientas.map((h, i) => (
                      <tr key={i} className="hover:bg-sipo-surface">
                        <td className="px-6 py-3 font-medium">{h.recursos?.nombre}</td>
                        <td className="px-6 py-3 text-center">{h.recursos?.unidad}</td>
                        <td className="px-6 py-3 text-right">{h.cantidad}</td>
                        <td className="px-6 py-3 text-right">{formatCOP(h.precio_unitario)}</td>
                        <td className="px-6 py-3 text-right font-bold">{formatCOP(parseNum(h.cantidad) * parseNum(h.precio_unitario))}</td>
                        <td className="px-6 py-3 text-center">
                           <button onClick={() => handleRemove(h.recurso_id)} className="text-sipo-red hover:bg-sipo-red-bg p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {newItem.tipo === 'herramientas' && (
                      <tr className="bg-sipo-orange-bg/10 animate-fade-in">
                        <td className="px-4 py-2"><input className="w-full p-2 rounded" placeholder="Herramienta..." value={newItem.nombre} onChange={e => setNewItem({...newItem, nombre: e.target.value})} /></td>
                        <td className="px-4 py-2 w-20"><input className="w-full p-2 rounded text-center" placeholder="Und" value={newItem.unidad} onChange={e => setNewItem({...newItem, unidad: e.target.value})} /></td>
                        <td className="px-4 py-2 w-24"><input type="number" className="w-full p-2 rounded text-right" value={newItem.cantidad} onChange={e => setNewItem({...newItem, cantidad: e.target.value})} /></td>
                        <td className="px-4 py-2 w-32"><input type="number" className="w-full p-2 rounded text-right" value={newItem.precio} onChange={e => setNewItem({...newItem, precio: e.target.value})} /></td>
                        <td className="px-4 py-2 text-right font-bold">{formatCOP(newItem.cantidad * newItem.precio)}</td>
                        <td className="px-4 py-2 flex gap-2">
                           <button onClick={() => handleAddItem('herramienta')} className="p-2 text-sipo-green"><Check size={18}/></button>
                           <button onClick={() => setNewItem({tipo:null})} className="p-2 text-sipo-red"><X size={18}/></button>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </section>

          {/* EQUIPOS */}
          <section className="bg-white rounded-xl border border-sipo-border shadow-sm overflow-hidden animate-fade-in">
            <TableHeader icon={Hammer} title="Equipos" onAdd={() => setNewItem({tipo: 'equipos', nombre: '', unidad: '', cantidad: 0, precio: 0})} />
            <table className="w-full text-left text-[13px]">
              <thead className="bg-sipo-surface border-b border-sipo-border">
                <tr className="text-[10px] uppercase font-bold text-sipo-slate">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3 text-center">Unidad</th>
                  <th className="px-6 py-3 text-right">Cantidad</th>
                  <th className="px-6 py-3 text-right">V. Unit</th>
                  <th className="px-6 py-3 text-right text-sipo-orange">Subtotal</th>
                  <th className="px-6 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {equipos.length === 0 && newItem.tipo !== 'equipos' ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-sipo-slate-light italic">No hay equipos agregados</td></tr>
                ) : (
                  <>
                    {equipos.map((e, i) => (
                      <tr key={i} className="hover:bg-sipo-surface">
                        <td className="px-6 py-3 font-medium">{e.recursos?.nombre}</td>
                        <td className="px-6 py-3 text-center">{e.recursos?.unidad}</td>
                        <td className="px-6 py-3 text-right">{e.cantidad}</td>
                        <td className="px-6 py-3 text-right">{formatCOP(e.precio_unitario)}</td>
                        <td className="px-6 py-3 text-right font-bold">{formatCOP(parseNum(e.cantidad) * parseNum(e.precio_unitario))}</td>
                        <td className="px-6 py-3 text-center">
                           <button onClick={() => handleRemove(e.recurso_id)} className="text-sipo-red hover:bg-sipo-red-bg p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {newItem.tipo === 'equipos' && (
                      <tr className="bg-sipo-orange-bg/10 animate-fade-in">
                        <td className="px-4 py-2"><input className="w-full p-2 rounded" placeholder="Equipo..." value={newItem.nombre} onChange={e => setNewItem({...newItem, nombre: e.target.value})} /></td>
                        <td className="px-4 py-2 w-20"><input className="w-full p-2 rounded text-center" placeholder="Und" value={newItem.unidad} onChange={e => setNewItem({...newItem, unidad: e.target.value})} /></td>
                        <td className="px-4 py-2 w-24"><input type="number" className="w-full p-2 rounded text-right" value={newItem.cantidad} onChange={e => setNewItem({...newItem, cantidad: e.target.value})} /></td>
                        <td className="px-4 py-2 w-32"><input type="number" className="w-full p-2 rounded text-right" value={newItem.precio} onChange={e => setNewItem({...newItem, precio: e.target.value})} /></td>
                        <td className="px-4 py-2 text-right font-bold">{formatCOP(newItem.cantidad * newItem.precio)}</td>
                        <td className="px-4 py-2 flex gap-2">
                           <button onClick={() => handleAddItem('equipos')} className="p-2 text-sipo-green"><Check size={18}/></button>
                           <button onClick={() => setNewItem({tipo:null})} className="p-2 text-sipo-red"><X size={18}/></button>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </section>

          {/* CUADRILLA Y RENDIMIENTO */}
          <section className="space-y-6">
             <div className="bg-sipo-carbon p-5 rounded-t-2xl flex items-center gap-3 text-sipo-cream border-b-[4px] border-sipo-orange">
              <Users size={22} className="text-sipo-orange" />
              <div className="flex-1">
                <h3 className="font-barlow font-bold uppercase tracking-wider text-lg">Cuadrilla y Rendimiento</h3>
                <p className="text-[10px] text-sipo-slate-light font-bold uppercase tracking-widest leading-none">Mano de Obra y Productividad</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Selector de Cuadrilla */}
              <div className="lg:col-span-2">
                {cuadrillas.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-sipo-orange/30 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-sipo-orange-bg rounded-full flex items-center justify-center">
                      <Users size={32} className="text-sipo-orange" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sipo-carbon text-lg">No tienes cuadrillas creadas</h4>
                      <p className="text-sipo-slate text-sm max-w-sm mt-1">Para calcular el costo de mano de obra en el APU, primero debes definir tus cuadrillas en el panel de configuración.</p>
                    </div>
                    <button 
                      onClick={() => navigate('/configuracion?tab=cuadrillas')}
                      className="bg-sipo-orange text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-sipo-orange/20 hover:scale-105 transition-all"
                    >
                      Ir a Configuración → Cuadrillas
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cuadrillas.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => setSelectedCuadrilla(c)}
                        className={`bg-white p-6 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                          selectedCuadrilla?.id === c.id 
                            ? 'border-sipo-green bg-sipo-green-bg/5 shadow-md scale-[1.02]' 
                            : 'border-sipo-border hover:border-sipo-orange/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-lg transition-colors ${selectedCuadrilla?.id === c.id ? 'bg-sipo-green text-white' : 'bg-sipo-surface text-sipo-slate'}`}>
                            <Users size={20} />
                          </div>
                          {selectedCuadrilla?.id === c.id && (
                            <div className="p-1 bg-sipo-green rounded-full text-white">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                        
                        <h5 className="font-bold text-sipo-carbon text-lg leading-tight uppercase font-barlow italic">{c.nombre}</h5>
                        <p className="text-[11px] text-sipo-slate mt-2 h-8 line-clamp-2 leading-relaxed">{c.descripcion || 'Sin descripción detallada'}</p>
                        
                        <div className="mt-6 pt-4 border-t border-sipo-border flex justify-between items-end">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-sipo-slate-light tracking-widest">Costo total día</p>
                            <p className={`font-barlow font-bold text-xl ${selectedCuadrilla?.id === c.id ? 'text-sipo-green' : 'text-sipo-carbon'}`}>
                              {formatCOP(c.costo_diario)}
                            </p>
                          </div>
                          <Link to="/configuracion?tab=cuadrillas" className="text-[10px] text-sipo-orange font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Ver composición</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel de Rendimiento */}
              <div className="space-y-6">
                {selectedCuadrilla ? (
                  <div className="bg-sipo-carbon p-8 rounded-3xl shadow-xl space-y-8 animate-fade-in sticky top-[100px] border-b-[6px] border-sipo-green overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 -mr-5 -mt-5">
                      <Users size={160} className="text-white" />
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[3px] text-sipo-green">Mano de Obra Seleccionada</span>
                        <h4 className="text-2xl font-barlow font-bold text-white uppercase italic mt-1 leading-none">{selectedCuadrilla.nombre}</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-sipo-slate-light text-xs font-bold uppercase tracking-wider">Rendimiento (rendimiento diario)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full p-5 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-sipo-orange outline-none text-3xl font-barlow font-bold text-white transition-all"
                            value={rendimiento}
                            onChange={(e) => setRendimiento(Math.max(0.01, Number(e.target.value)))}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sipo-slate-light font-bold text-lg">
                            {partida?.unidad || 'm2'} / día
                          </span>
                        </div>
                        <p className="text-[10px] text-sipo-slate-light italic">¿Cuánta {partida?.unidad || 'm2'} hace esta cuadrilla en 8 horas?</p>
                      </div>

                      <div className="pt-6 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-sipo-slate-light uppercase font-bold tracking-wider">Costo Día:</span>
                          <span className="text-white font-medium">{formatCOP(selectedCuadrilla.costo_diario)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-sipo-orange uppercase font-bold tracking-wider">Costo por {partida?.unidad || 'm2'}:</span>
                          <span className="text-2xl font-barlow font-bold text-sipo-orange">{formatCOP(costoCuadrillaUnidad)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-sipo-surface p-10 rounded-3xl border-2 border-dashed border-sipo-border flex flex-col items-center text-center space-y-4 sticky top-[100px]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Users size={32} className="text-sipo-slate-light" />
                    </div>
                    <div>
                      <p className="font-bold text-sipo-slate uppercase text-xs tracking-wider">Paso siguiente</p>
                      <p className="text-sipo-slate-light text-sm mt-1">Selecciona una cuadrilla del panel izquierdo para calcular el rendimiento.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Footer calculado */}
        <footer className="sticky bottom-4 left-0 right-0 z-20">
          <div className="bg-sipo-carbon p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row justify-between items-center border-b-[4px] border-sipo-orange">
            <div>
              <p className="text-[10px] uppercase text-sipo-orange font-bold tracking-[2px]">Total APU consolidado</p>
              <h2 className="text-4xl font-barlow font-bold text-white mt-1">
                {formatCOP(totalAPUUnidad)} <span className="text-xl text-sipo-slate-light font-normal italic">{'por'} {partida?.unidad || 'm2'}</span>
              </h2>
            </div>
            <div className="flex gap-4 mt-6 md:mt-0">
              <button 
                onClick={handleSaveAPU}
                className="group bg-white hover:bg-sipo-orange text-sipo-carbon hover:text-white font-bold py-4 px-10 rounded-xl flex items-center gap-3 transition-all active:scale-95"
              >
                Guardar APU
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </footer>

        {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
      </div>
    </div>
  );
};

export default Step3APU;
