import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Ruler, 
  ChevronRight, 
  Search,
  Loader2,
  AlertCircle,
  X,
  ArrowRight
} from 'lucide-react';
import TabProgreso from '../../../components/TabProgreso';
import { formatCOP } from '../../../utils/format';

const Step2Partidas = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [partidas, setPartidas] = useState([]);
  const [obra, setObra] = useState(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    unidad: 'm2',
    cantidad: 1,
    valor_unitario: 0,
    descripcion: ''
  });
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [obraRes, partidasRes] = await Promise.all([
        fetch(`http://localhost:3000/api/obras/${id}`),
        fetch(`http://localhost:3000/api/partidas/obra/${id}`)
      ]);
      
      const obraData = await obraRes.json();
      const partidasData = await partidasRes.json();

      if (obraData.success) setObra(obraData.data);
      if (partidasData.success) setPartidas(partidasData.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) localStorage.setItem('obraActivaId', id);
    fetchData();
  }, [id]);

  const handleOpenModal = (partida = null) => {
    if (partida) {
      setIsEditing(true);
      setSelectedId(partida.id);
      setFormData({
        nombre: partida.nombre,
        unidad: partida.unidad || 'm2',
        cantidad: partida.cantidad || 1,
        valor_unitario: partida.valor_unitario || 0,
        descripcion: partida.descripcion || ''
      });
    } else {
      setIsEditing(false);
      setSelectedId(null);
      setFormData({
        nombre: '',
        unidad: 'm2',
        cantidad: 1,
        valor_unitario: 0,
        descripcion: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing 
        ? `http://localhost:3000/api/partidas/${selectedId}` 
        : 'http://localhost:3000/api/partidas';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, obra_id: id })
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchData(); // Recargar lista
      }
    } catch (err) {
      console.error('Error guardando partida:', err);
    }
  };

  const handleDelete = async (pid) => {
    if (!window.confirm('¿Estás seguro de eliminar esta partida? Esta acción no se puede deshacer.')) return;
    try {
      const response = await fetch(`http://localhost:3000/api/partidas/${pid}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setPartidas(partidas.filter(p => p.id !== pid));
      }
    } catch (err) {
      console.error('Error eliminando partida:', err);
    }
  };

  const handleContinue = () => {
    // Buscar primera partida pendiente de APU
    const pendiente = partidas.find(p => p.estado !== 'listo');
    if (pendiente) {
      navigate(`/obras/${id}/partidas/${pendiente.id}/apu`);
    } else if (partidas.length > 0) {
      navigate(`/obras/${id}/partidas/${partidas[0].id}/apu`);
    } else {
      alert('Agrega al menos una partida para continuar.');
    }
  };

  const getStatusPill = (status) => {
    const s = status?.toLowerCase();
    if (s === 'listo' || s === 'apu listo') return <span className="px-3 py-1 bg-sipo-green-bg text-sipo-green text-[10px] uppercase font-bold rounded-full">APU Listo</span>;
    if (s === 'revision') return <span className="px-3 py-1 bg-sipo-orange-bg text-sipo-orange text-[10px] uppercase font-bold rounded-full">En Revisión</span>;
    return <span className="px-3 py-1 bg-gray-100 text-sipo-slate-light text-[10px] uppercase font-bold rounded-full">Pendiente APU</span>;
  };

  const totalDirecto = partidas.reduce((sum, p) => sum + (Number(p.valor_unitario * p.cantidad) || 0), 0);

  return (
    <div className="animate-fade-in pb-20">
      <TabProgreso currentStep={2} />

      <div className="max-w-[1200px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic uppercase">Gestión de Partidas</h1>
            <p className="text-sipo-slate text-sm">
              Obra: <span className="text-sipo-carbon font-bold">{obra?.nombre || 'Cargando...'}</span>
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-sipo-orange/20"
          >
            <Plus size={20} />
            Nueva partida
          </button>
        </header>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-sipo-orange" size={40} />
            <p className="text-sipo-slate font-medium">Cargando partidas de la obra...</p>
          </div>
        ) : partidas.length === 0 ? (
          <div className="bg-white p-20 rounded-2xl border border-dashed border-sipo-border flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-sipo-surface rounded-full flex items-center justify-center">
              <Search size={32} className="text-sipo-slate-light" />
            </div>
            <p className="text-sipo-slate max-w-xs font-medium">Esta obra no tiene partidas aún. Agrega la primera para empezar tu APU.</p>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-sipo-orange text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-sipo-orange/20 flex items-center gap-2"
            >
              <Plus size={18} />
              Agregar primera partida
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-sipo-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sipo-carbon border-b border-white/5">
                    <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light w-16">#</th>
                    <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light">Partida</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light text-center">Unidad</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light text-right">Cantidad</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light text-right">V. Unitario</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light text-right">Total</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light text-center">Estado</th>
                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-bold text-sipo-slate-light text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sipo-border">
                  {partidas.map((partida, index) => (
                    <tr key={partida.id} className="hover:bg-sipo-orange-bg/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-full bg-sipo-orange/10 flex items-center justify-center text-sipo-orange font-bold text-xs">
                          {(index + 1).toString().padStart(2, '0')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-sipo-carbon">{partida.nombre}</p>
                        <p className="text-[11px] text-sipo-slate leading-tight mt-1 line-clamp-1">{partida.descripcion}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-sipo-slate uppercase">{partida.unidad || 'm2'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[13px] font-medium text-sipo-carbon">{partida.cantidad || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[13px] font-medium text-sipo-slate">{formatCOP(partida.valor_unitario)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[13px] font-bold text-sipo-orange">{formatCOP(partida.valor_unitario * partida.cantidad)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusPill(partida.estado)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(partida)}
                            className="p-2 text-sipo-blue hover:bg-sipo-blue-bg rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/obras/${id}/partidas/${partida.id}/apu`)}
                            className="p-2 text-sipo-orange hover:bg-sipo-orange-bg rounded-lg transition-colors border border-sipo-orange/20" 
                            title="Continuar → APU"
                          >
                            <ArrowRight size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(partida.id)}
                            className="p-2 text-sipo-red hover:bg-sipo-red-bg rounded-lg transition-colors" 
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pie de tabla */}
            <div className="bg-sipo-surface p-6 flex flex-col md:flex-row justify-between items-center border-t border-sipo-border gap-4">
              <div className="flex gap-6 text-[11px] uppercase font-bold tracking-wider text-sipo-slate">
                <span>{partidas.length} partidas</span>
                <span className="text-sipo-green">{partidas.filter(p => p.estado === 'listo').length} APU completos</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-sipo-carbon italic">Costo directo estimado:</span>
                <span className="text-2xl font-barlow font-bold text-sipo-orange">{formatCOP(totalDirecto)}</span>
              </div>
            </div>
          </div>
        )}

        <footer className="flex justify-end pt-10">
          <button 
            onClick={handleContinue}
            className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-4 px-10 rounded-xl flex items-center gap-3 transition-all shadow-xl active:scale-95"
          >
            Continuar → APU
            <ChevronRight size={20} />
          </button>
        </footer>

        {/* Modal Formulario Partida */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sipo-carbon/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
              <header className="bg-sipo-carbon p-6 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-barlow font-bold text-xl uppercase italic">
                    {isEditing ? 'Editar Partida' : 'Nueva Partida'}
                  </h3>
                  <p className="text-[10px] text-sipo-slate-light font-bold uppercase tracking-widest">Flujo de Obra SIPO</p>
                </div>
                <button onClick={() => setShowModal(false)} className="hover:text-sipo-orange transition-colors">
                  <X size={24} />
                </button>
              </header>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label>Nombre de la partida*</label>
                  <input 
                    type="text" required
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium"
                    placeholder="Ej. Mampostería en bloque 10cm"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Unidad*</label>
                    <select 
                      className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium"
                      value={formData.unidad}
                      onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                    >
                      <option value="m2">Metros Cuadrados (m2)</option>
                      <option value="m3">Metros Cúbicos (m3)</option>
                      <option value="ml">Metros Lineales (ml)</option>
                      <option value="un">Unidad (un)</option>
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="glb">Global (glb)</option>
                    </select>
                  </div>
                  <div>
                    <label>Cantidad en obra*</label>
                    <input 
                      type="number" step="0.01" required
                      className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({...formData, cantidad: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label>Costo Unitario Estimado (COP)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-bold text-lg text-sipo-orange"
                    placeholder="0.00"
                    value={formData.valor_unitario}
                    onChange={(e) => setFormData({...formData, valor_unitario: Number(e.target.value)})}
                  />
                  <p className="text-[10px] text-sipo-slate mt-1 italic">Este valor se sobreescribirá al completar el APU detallado.</p>
                </div>
                <div>
                  <label>Descripción opcional</label>
                  <textarea 
                    className="w-full mt-2 p-3 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none font-medium text-xs h-24"
                    placeholder="Detalles sobre la partida..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-4"
                >
                  {isEditing ? 'Actualizar Partida' : 'Agregar Partida'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2Partidas;
