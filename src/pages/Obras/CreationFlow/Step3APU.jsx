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
  const [apuDetalles, setApuDetalles] = useState([]);
  
  // Estados para las 4 secciones
  const [materiales, setMateriales] = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [rendimiento, setRendimiento] = useState(1);

  // Inline Row State
  const [newItem, setNewItem] = useState({ tipo: null, nombre: '', unidad: '', cantidad: 0, precio: 0, recurso_id: null });
  const [recursosCatalogo, setRecursosCatalogo] = useState([]);
  const [filteredRecursos, setFilteredRecursos] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estado para creación de cuadrilla inline
  const [isCreatingCuadrilla, setIsCreatingCuadrilla] = useState(false);
  const [newCuadrilla, setNewCuadrilla] = useState({ nombre: '', costo_diario: '' });

  const handleAddCuadrilla = async (cuadrilla) => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      const res = await fetch('http://localhost:3000/api/apu-detalle', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          partida_id: pid,
          cuadrilla_id: cuadrilla.id,
          cantidad: 1, // Rendimiento inicial 1
          precio_unitario: cuadrilla.costo_diario,
          rendimiento: 1
        })
      });
      
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error al agregar cuadrilla:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
      const authHeader = { 'Authorization': `Bearer ${token}` };

      const [obraRes, partidaRes, apuRes, cuadrillasRes, recursosRes] = await Promise.all([
        fetch(`http://localhost:3000/api/obras/${id}`, { headers: authHeader }),
        fetch(`http://localhost:3000/api/partidas/${pid}`, { headers: authHeader }),
        fetch(`http://localhost:3000/api/apu-detalle/partida/${pid}`, { headers: authHeader }),
        fetch(`http://localhost:3000/api/cuadrillas/usuario/${userId}`, { headers: authHeader }),
        fetch(`http://localhost:3000/api/recursos/usuario/${userId}`, { headers: authHeader })
      ]);

      const oData = await obraRes.json();
      const pData = await partidaRes.json();
      const apuData = await apuRes.json();
      const cData = await cuadrillasRes.json();
      const rData = await recursosRes.json();
      
      if (oData.success) setObra(oData.data);
      if (pData.success) setPartida(pData.data);
      
      if (Array.isArray(apuData.data)) {
        const detalles = apuData.data;
        setApuDetalles(detalles);
        setMateriales(detalles.filter(d => d.recursos?.tipo === 'material'));
        setHerramientas(detalles.filter(d => d.recursos?.tipo === 'herramienta'));
        setEquipos(detalles.filter(d => d.recursos?.tipo === 'equipo'));
        
        
      }

      if (Array.isArray(cData.data)) setCuadrillas(cData.data);
      if (Array.isArray(rData.data)) setRecursosCatalogo(rData.data);

    } catch (err) {
      console.error('Error cargando APU:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pid && id) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3000/api/obras/${id}/partidas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
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

  const handleSearchNombre = (val, tipo) => {
    setNewItem({ ...newItem, nombre: val, recurso_id: null });
    const tipoRecurso = tipo === 'materiales' ? 'material' : tipo === 'herramientas' ? 'herramienta' : 'equipo';
    
    if (!val || val.trim().length === 0) {
      setFilteredRecursos([]);
      setShowSuggestions(false);
      return;
    }
    
    const matches = recursosCatalogo.filter(r => 
      r.tipo === tipoRecurso && 
      r.nombre.toLowerCase().includes(val.toLowerCase().trim())
    );

    // Eliminar duplicados por nombre (insensible a mayúsculas)
    const uniqueMatches = [];
    const seenNames = new Set();
    
    matches.forEach(m => {
      const nameKey = m.nombre.toLowerCase().trim();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueMatches.push(m);
      }
    });
    
    setFilteredRecursos(uniqueMatches);
    setShowSuggestions(uniqueMatches.length > 0);
  };

  const handleTargetLaborCostChange = (val) => {
    const targetCost = Number(val);
    if (targetCost > 0 && selectedCuadrilla?.costo_diario) {
      // Rendimiento = Costo Diario / Costo Objetivo por Unidad
      const calculatedRend = selectedCuadrilla.costo_diario / targetCost;
      setRendimiento(Number(calculatedRend.toFixed(4)));
    }
  };

  const handleSelectRecurso = (recurso) => {
    setNewItem({
      ...newItem,
      nombre: recurso.nombre,
      unidad: recurso.unidad,
      precio: recurso.precio_unitario,
      recurso_id: recurso.id
    });
    setShowSuggestions(false);
  };

  const handleAddItem = async (tipo) => {
    if (!newItem.nombre) {
      alert('Debes escribir el nombre del ítem para agregarlo.');
      return;
    }
    
    const unidadFinal = newItem.unidad?.trim() || 'Und';

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      let recursoId = newItem.recurso_id;

      if (!recursoId) {
        const tipoRecurso = tipo === 'materiales' ? 'material' : tipo === 'herramientas' ? 'herramienta' : 'equipo';
        const precioFinal = Math.max(parseNum(newItem.precio) || 0, 0.01);

        const recursoRes = await fetch('http://localhost:3000/api/recursos', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            usuario_id: user.id,
            nombre: newItem.nombre.trim(),
            tipo: tipoRecurso,
            unidad: unidadFinal,
            precio_unitario: precioFinal
          })
        });
        const recursoData = await recursoRes.json();
        if (!recursoData.success) {
          alert('❌ Error al crear recurso: ' + (recursoData.message || ''));
          return;
        }
        recursoId = recursoData.data?.id;
      }

      const cantidadFinal = Math.max(parseNum(newItem.cantidad) || 0, 0.01);
      const precioFinal = Math.max(parseNum(newItem.precio) || 0, 0.01);

      const apuRes = await fetch('http://localhost:3000/api/apu-detalle', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          partida_id: pid,
          recurso_id: recursoId,
          cantidad: cantidadFinal,
          precio_unitario: precioFinal
        })
      });
      const apuData = await apuRes.json();

      if (apuData.success) {
        setNewItem({ tipo: null, nombre: '', unidad: '', cantidad: 0, precio: 0, recurso_id: null });
        fetchData();
      } else {
        alert('Error al agregar ítem al APU: ' + apuData.message);
      }
    } catch (err) {
      console.error('❌ Error agregando ítem:', err);
    }
  };

  const handleChangeItem = (apuDetalleId, field, value) => {
    const updated = apuDetalles.map(d => d.id === apuDetalleId ? { ...d, [field]: value } : d);
    setApuDetalles(updated);
    setMateriales(updated.filter(d => d.recursos?.tipo === 'material'));
    setHerramientas(updated.filter(d => d.recursos?.tipo === 'herramienta'));
    setEquipos(updated.filter(d => d.recursos?.tipo === 'equipo'));
  };

  const handleUpdateItem = async (apuDetalleId, field, value) => {
    try {
      const token = localStorage.getItem('token');
      const numValue = parseNum(value);
      if (isNaN(numValue)) return;

      const response = await fetch(`http://localhost:3000/api/apu-detalle/${apuDetalleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [field]: numValue })
      });
      
      if (response.ok) {
        // La interfaz ya se actualizó localmente, aquí aseguramos el numérico parseado final
        const updated = apuDetalles.map(d => d.id === apuDetalleId ? { ...d, [field]: numValue } : d);
        setApuDetalles(updated);
        setMateriales(updated.filter(d => d.recursos?.tipo === 'material'));
        setHerramientas(updated.filter(d => d.recursos?.tipo === 'herramienta'));
        setEquipos(updated.filter(d => d.recursos?.tipo === 'equipo'));
      }
    } catch (err) {
      console.error('Error actualizando ítem:', err);
    }
  };

  const handleRemove = async (apuDetalleId) => {
    if (!apuDetalleId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/apu-detalle/${apuDetalleId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando ítem:', err);
    }
  };

  const handleCreateCuadrilla = async () => {
    if (!newCuadrilla.nombre) {
      alert('Debes darle un nombre a la cuadrilla');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const costoDiario = Math.max(parseNum(newCuadrilla.costo_diario) || 0, 0);

      const res = await fetch('http://localhost:3000/api/cuadrillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          usuario_id: user.id,
          nombre: newCuadrilla.nombre.trim(),
          costo_diario: costoDiario
        })
      });

      const data = await res.json();
      if (data.success) {
        setCuadrillas([...cuadrillas, data.data]);
        handleAddCuadrilla(data.data); // Agregar automáticamente al APU actual
        setIsCreatingCuadrilla(false);
        setNewCuadrilla({ nombre: '', costo_diario: '' });
      } else {
        alert('Error al crear cuadrilla: ' + (data.message || ''));
      }
    } catch (err) {
      console.error('Error creando cuadrilla:', err);
    }
  };

  const handleSaveAPU = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      // Las cuadrillas ya se guardan al agregarse o editarse inline. 
      // Solo actualizamos el valor unitario de la partida.
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch(`http://localhost:3000/api/partidas/${pid}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ 
          valor_unitario: totalAPUUnidad,
          obra_id: id,
          nombre: partida.nombre,
          unidad: partida.unidad,
          cantidad: partida.cantidad
        })
      });

      setShowToast({ message: 'APU guardado correctamente ✓', type: 'success' });
      setTimeout(() => navigate(`/obras/${id}/costos`), 1000);
    } catch (err) {
      console.error('❌ Error guardando APU:', err);
      navigate(`/obras/${id}/costos`);
    }
  };

  // Cálculos
  const totalMateriales = materiales.reduce((sum, item) => sum + (parseNum(item.cantidad) * parseNum(item.precio_unitario)), 0);
  const totalHerramientas = herramientas.reduce((sum, item) => sum + (parseNum(item.cantidad) * parseNum(item.precio_unitario)), 0);
  const totalEquipos = equipos.reduce((sum, item) => sum + (parseNum(item.cantidad) * parseNum(item.precio_unitario)), 0);
  
  const totalCuadrillas = apuDetalles
    .filter(d => d.cuadrillas || d.cuadrilla_id)
    .reduce((sum, c) => sum + (Number(c.precio_unitario) / (Number(c.rendimiento) || 1)), 0);

  const totalAPUUnidad = totalMateriales + totalHerramientas + totalEquipos + totalCuadrillas;

  const renderTableHeader = (Icon, title, onAdd) => (
    <div className="bg-sipo-carbon p-4 flex justify-between items-center rounded-t-xl">
      <div className="flex items-center gap-3 text-sipo-cream">
        <Icon size={20} className="text-sipo-orange" />
        <h3 className="font-barlow font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <button onClick={onAdd} className="text-[10px] uppercase font-bold text-sipo-orange hover:text-white flex items-center gap-1 transition-colors">
        <Plus size={14} /> Agregar ítem
      </button>
    </div>
  );

  const renderAutocompleteRow = (tipo) => (
    <tr className="bg-sipo-orange-bg/10 animate-fade-in border-2 border-sipo-orange/30">
      <td className="px-4 py-2 relative">
        <input 
          className="w-full p-2 rounded border border-sipo-border outline-none focus:border-sipo-orange font-bold text-sipo-carbon bg-white" 
          placeholder="Buscar o escribir nuevo..." 
          value={newItem.nombre} 
          onChange={e => handleSearchNombre(e.target.value, tipo)}
          onFocus={() => newItem.nombre && setShowSuggestions(true)}
          onKeyDown={e => e.key === 'Enter' && handleAddItem(tipo)}
        />
        {showSuggestions && filteredRecursos.length > 0 && (
          <div className="absolute left-0 right-0 z-[999] mt-1 bg-white border-2 border-sipo-orange rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            <div className="bg-sipo-orange/5 p-2 border-b border-sipo-orange/20">
              <p className="text-[10px] font-bold text-sipo-orange uppercase tracking-widest text-center">Catálogo Global</p>
            </div>
            {filteredRecursos.map(r => (
              <div key={r.id} className="p-3 hover:bg-sipo-orange hover:text-white cursor-pointer border-b border-sipo-border last:border-none flex justify-between items-center group transition-colors" onClick={() => handleSelectRecurso(r)}>
                <div>
                  <p className="font-bold text-sm">{r.nombre}</p>
                  <p className="text-[10px] uppercase font-bold opacity-80">{r.unidad} • {formatCOP(r.precio_unitario)}</p>
                </div>
                <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-2 w-20"><input className="w-full p-2 rounded text-center bg-white border border-sipo-border" placeholder="Und" value={newItem.unidad} onChange={e => setNewItem({...newItem, unidad: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddItem(tipo)} /></td>
      <td className="px-4 py-2 w-24"><input type="number" className="w-full p-2 rounded text-right bg-white border border-sipo-border" value={newItem.cantidad} onChange={e => setNewItem({...newItem, cantidad: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddItem(tipo)} /></td>
      <td className="px-4 py-2 w-32"><input type="number" className="w-full p-2 rounded text-right bg-white border border-sipo-border" value={newItem.precio} onChange={e => setNewItem({...newItem, precio: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddItem(tipo)} /></td>
      <td className="px-4 py-2 text-right font-bold text-sipo-carbon">{formatCOP(newItem.cantidad * newItem.precio)}</td>
      <td className="px-4 py-2 flex gap-1">
         <button onClick={() => handleAddItem(tipo)} className="p-2 bg-sipo-green text-white rounded-lg hover:scale-105 transition-transform"><Check size={16}/></button>
         <button onClick={() => {setNewItem({tipo:null, nombre:'', unidad:'', cantidad:0, precio:0, recurso_id:null}); setShowSuggestions(false);}} className="p-2 bg-white text-sipo-red border border-sipo-red rounded-lg"><X size={16}/></button>
      </td>
    </tr>
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
            <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic uppercase">APU: {partida?.nombre}</h1>
          </div>
          <button onClick={handleSaveAPU} className="bg-sipo-green hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg">
            <Save size={18} /> Guardar APU
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Unidad', value: partida?.unidad || 'm2' },
            { label: 'Cantidad Obra', value: partida?.cantidad || 0 },
            { label: 'Costo Unitario', value: formatCOP(totalAPUUnidad), highlight: true }
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-sipo-border border-t-[3px] border-t-sipo-orange shadow-sm">
              <p className="text-[10px] uppercase text-sipo-slate font-bold">{card.label}</p>
              <h4 className={`text-xl font-barlow font-bold mt-1 ${card.highlight ? 'text-sipo-orange' : 'text-sipo-carbon'}`}>{card.value}</h4>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          {/* MATERIALES */}
          <section className="bg-white rounded-xl border border-sipo-border shadow-sm overflow-visible">
            {renderTableHeader(Package, "Materiales", () => setNewItem({tipo: 'materiales', nombre: '', unidad: '', cantidad: 0, precio: 0}))}
            <table className="w-full text-left text-[13px]">
              <thead className="bg-sipo-surface border-b border-sipo-border">
                <tr className="text-[10px] uppercase font-bold text-sipo-slate">
                  <th className="px-6 py-3">Recurso</th>
                  <th className="px-6 py-3 text-center">Und</th>
                  <th className="px-6 py-3 text-right">Cant</th>
                  <th className="px-6 py-3 text-right">Precio</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {materiales.map((m, i) => (
                  <tr key={i} className="hover:bg-sipo-surface">
                    <td className="px-6 py-3 font-medium">{m.recursos?.nombre}</td>
                    <td className="px-6 py-3 text-center">{m.recursos?.unidad}</td>
                    <td className="px-6 py-3 text-right">
                      <input type="number" className="w-20 p-1 border border-transparent hover:border-sipo-border focus:border-sipo-orange rounded text-right bg-transparent outline-none" value={m.cantidad} onChange={(e) => handleChangeItem(m.id, 'cantidad', e.target.value)} onBlur={(e) => handleUpdateItem(m.id, 'cantidad', e.target.value)} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input type="number" className="w-28 p-1 border border-transparent hover:border-sipo-border focus:border-sipo-orange rounded text-right bg-transparent outline-none" value={m.precio_unitario} onChange={(e) => handleChangeItem(m.id, 'precio_unitario', e.target.value)} onBlur={(e) => handleUpdateItem(m.id, 'precio_unitario', e.target.value)} />
                    </td>
                    <td className="px-6 py-3 text-right font-bold">{formatCOP(Number(m.cantidad) * Number(m.precio_unitario))}</td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => handleRemove(m.id)} className="text-sipo-red p-1.5 rounded-lg hover:bg-sipo-red-bg transition-colors"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                {newItem.tipo === 'materiales' && renderAutocompleteRow('materiales')}
              </tbody>
            </table>
          </section>

          {/* HERRAMIENTAS */}
          <section className="bg-white rounded-xl border border-sipo-border shadow-sm overflow-visible">
            {renderTableHeader(Wrench, "Herramientas", () => setNewItem({tipo: 'herramientas', nombre: '', unidad: '', cantidad: 0, precio: 0}))}
            <table className="w-full text-left text-[13px]">
              <thead className="bg-sipo-surface border-b border-sipo-border">
                <tr className="text-[10px] uppercase font-bold text-sipo-slate">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3 text-center">Und</th>
                  <th className="px-6 py-3 text-right">Cant</th>
                  <th className="px-6 py-3 text-right">V. Unit</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {herramientas.map((h, i) => (
                  <tr key={i} className="hover:bg-sipo-surface">
                    <td className="px-6 py-3 font-medium">{h.recursos?.nombre}</td>
                    <td className="px-6 py-3 text-center">{h.recursos?.unidad}</td>
                    <td className="px-6 py-3 text-right">
                      <input type="number" className="w-20 p-1 border border-transparent hover:border-sipo-border focus:border-sipo-orange rounded text-right bg-transparent outline-none" value={h.cantidad} onChange={(e) => handleChangeItem(h.id, 'cantidad', e.target.value)} onBlur={(e) => handleUpdateItem(h.id, 'cantidad', e.target.value)} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input type="number" className="w-28 p-1 border border-transparent hover:border-sipo-border focus:border-sipo-orange rounded text-right bg-transparent outline-none" value={h.precio_unitario} onChange={(e) => handleChangeItem(h.id, 'precio_unitario', e.target.value)} onBlur={(e) => handleUpdateItem(h.id, 'precio_unitario', e.target.value)} />
                    </td>
                    <td className="px-6 py-3 text-right font-bold">{formatCOP(Number(h.cantidad) * Number(h.precio_unitario))}</td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => handleRemove(h.id)} className="text-sipo-red p-1.5 rounded-lg hover:bg-sipo-red-bg transition-colors"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                {newItem.tipo === 'herramientas' && renderAutocompleteRow('herramientas')}
              </tbody>
            </table>
          </section>

          {/* EQUIPOS */}
          <section className="bg-white rounded-xl border border-sipo-border shadow-sm overflow-visible">
            {renderTableHeader(Hammer, "Equipos", () => setNewItem({tipo: 'equipos', nombre: '', unidad: '', cantidad: 0, precio: 0}))}
            <table className="w-full text-left text-[13px]">
              <thead className="bg-sipo-surface border-b border-sipo-border">
                <tr className="text-[10px] uppercase font-bold text-sipo-slate">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3 text-center">Und</th>
                  <th className="px-6 py-3 text-right">Cant</th>
                  <th className="px-6 py-3 text-right">V. Unit</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {equipos.map((e, i) => (
                  <tr key={i} className="hover:bg-sipo-surface">
                    <td className="px-6 py-3 font-medium">{e.recursos?.nombre}</td>
                    <td className="px-6 py-3 text-center">{e.recursos?.unidad}</td>
                    <td className="px-6 py-3 text-right">
                      <input type="number" className="w-20 p-1 border border-transparent hover:border-sipo-border focus:border-sipo-orange rounded text-right bg-transparent outline-none" value={e.cantidad} onChange={(evt) => handleChangeItem(e.id, 'cantidad', evt.target.value)} onBlur={(evt) => handleUpdateItem(e.id, 'cantidad', evt.target.value)} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input type="number" className="w-28 p-1 border border-transparent hover:border-sipo-border focus:border-sipo-orange rounded text-right bg-transparent outline-none" value={e.precio_unitario} onChange={(evt) => handleChangeItem(e.id, 'precio_unitario', evt.target.value)} onBlur={(evt) => handleUpdateItem(e.id, 'precio_unitario', evt.target.value)} />
                    </td>
                    <td className="px-6 py-3 text-right font-bold">{formatCOP(Number(e.cantidad) * Number(e.precio_unitario))}</td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => handleRemove(e.id)} className="text-sipo-red p-1.5 rounded-lg hover:bg-sipo-red-bg transition-colors"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                {newItem.tipo === 'equipos' && renderAutocompleteRow('equipos')}
              </tbody>
            </table>
          </section>

          {/* CUADRILLAS (MANO DE OBRA) */}
          <section className="bg-white rounded-xl border border-sipo-border shadow-sm overflow-visible">
            {renderTableHeader(Users, "Mano de Obra (Cuadrillas)", () => setIsCreatingCuadrilla(true))}
            <table className="w-full text-left text-[13px]">
              <thead className="bg-sipo-surface border-b border-sipo-border">
                <tr className="text-[10px] uppercase font-bold text-sipo-slate">
                  <th className="px-6 py-3">Cuadrilla</th>
                  <th className="px-6 py-3 text-right">Rendimiento (Und/Día)</th>
                  <th className="px-6 py-3 text-right">Costo Diario</th>
                  <th className="px-6 py-3 text-right">Costo Unitario</th>
                  <th className="px-6 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {apuDetalles.filter(d => d.cuadrillas || d.cuadrilla_id).map((c, i) => (
                  <tr key={i} className="hover:bg-sipo-surface">
                    <td className="px-6 py-3 font-medium">{c.cuadrillas?.nombre || 'Cuadrilla'}</td>
                    <td className="px-6 py-3 text-right">
                      <input 
                        type="number" 
                        step="0.0001"
                        className="w-24 p-1 border border-transparent hover:border-sipo-border focus:border-sipo-orange rounded text-right bg-transparent outline-none" 
                        value={c.rendimiento} 
                        onChange={(e) => handleChangeItem(c.id, 'rendimiento', e.target.value)} 
                        onBlur={(e) => handleUpdateItem(c.id, 'rendimiento', e.target.value)} 
                      />
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">{formatCOP(c.precio_unitario)}</td>
                    <td className="px-6 py-3 text-right font-bold text-sipo-orange">
                      {formatCOP(Number(c.precio_unitario) / (Number(c.rendimiento) || 1))}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => handleRemove(c.id)} className="text-sipo-red p-1.5 rounded-lg hover:bg-sipo-red-bg transition-colors"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
                
                {/* Selector de cuadrilla existente */}
                <tr className="bg-sipo-surface/50">
                  <td className="px-6 py-3" colSpan="5">
                    <div className="flex items-center gap-4">
                      <select 
                        className="flex-1 p-2 rounded border border-sipo-border bg-white outline-none focus:border-sipo-orange font-bold text-xs"
                        onChange={(e) => {
                          const c = cuadrillas.find(cuad => cuad.id === e.target.value);
                          if (c) handleAddCuadrilla(c);
                        }}
                        value=""
                      >
                        <option value="">+ Agregar cuadrilla del catálogo...</option>
                        {cuadrillas.filter(c => !apuDetalles.some(d => d.cuadrilla_id === c.id)).map(c => (
                          <option key={c.id} value={c.id}>{c.nombre} ({formatCOP(c.costo_diario)}/día)</option>
                        ))}
                      </select>
                      
                      <button 
                        onClick={() => setIsCreatingCuadrilla(true)}
                        className="text-[10px] font-bold text-sipo-orange uppercase hover:underline"
                      >
                        Crear nueva cuadrilla
                      </button>
                    </div>
                  </td>
                </tr>

                {isCreatingCuadrilla && (
                  <tr className="bg-sipo-orange-bg/10 border-2 border-sipo-orange/30">
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        placeholder="Nombre (ej. Oficial + Ayudante)" 
                        className="w-full p-2 rounded border border-sipo-border outline-none focus:border-sipo-orange font-bold text-xs"
                        value={newCuadrilla.nombre}
                        onChange={e => setNewCuadrilla({...newCuadrilla, nombre: e.target.value})}
                      />
                    </td>
                    <td className="px-6 py-3" colSpan="2">
                      <input 
                        type="number" 
                        placeholder="Costo Diario ($)" 
                        className="w-full p-2 rounded border border-sipo-border outline-none focus:border-sipo-orange font-bold text-xs"
                        value={newCuadrilla.costo_diario}
                        onChange={e => setNewCuadrilla({...newCuadrilla, costo_diario: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && handleCreateCuadrilla()}
                      />
                    </td>
                    <td className="px-6 py-3"></td>
                    <td className="px-6 py-3 flex gap-1">
                       <button onClick={handleCreateCuadrilla} className="p-2 bg-sipo-green text-white rounded-lg"><Check size={16}/></button>
                       <button onClick={() => setIsCreatingCuadrilla(false)} className="p-2 bg-white text-sipo-red border border-sipo-red rounded-lg"><X size={16}/></button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        <footer className="sticky bottom-4 z-[50]">
          <div className="bg-sipo-carbon p-6 rounded-2xl shadow-2xl flex justify-between items-center border-b-[4px] border-sipo-orange">
            <div>
              <p className="text-[10px] uppercase text-sipo-orange font-bold">Total Unitario</p>
              <h2 className="text-4xl font-barlow font-bold text-white">{formatCOP(totalAPUUnidad)}</h2>
            </div>
            <button onClick={handleSaveAPU} className="bg-white hover:bg-sipo-orange text-sipo-carbon hover:text-white font-bold py-4 px-10 rounded-xl transition-all">
              Guardar y Continuar
            </button>
          </div>
        </footer>
        {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
      </div>
    </div>
  );
};

export default Step3APU;
