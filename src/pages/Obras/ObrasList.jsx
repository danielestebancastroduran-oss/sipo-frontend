import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Plus, 
  ArrowRight,
  Loader2,
  HardHat,
  Search
} from 'lucide-react';

const ObrasList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [obras, setObras] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/obras/usuario/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if ((data.success || data.data) && Array.isArray(data.data)) {
          setObras([...data.data]);
        }
      } catch (err) {
        console.error('Error cargando obras:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Solo al montar

  const formatCOP = (val) => {
    if (isNaN(val) || val === null) return '$0';
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'activo') return 'bg-sipo-blue-bg text-sipo-blue border-sipo-blue/20';
    if (s === 'finalizado') return 'bg-sipo-green-bg text-sipo-green border-sipo-green/20';
    return 'bg-amber-50 text-amber-600 border-amber-200';
  };

  const [statusFilter, setStatusFilter] = useState('Todos');

  const filteredObras = (obras || []).filter(o => {
    const matchesSearch = (o.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (o.cliente?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || 
                         (o.estado || 'borrador').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic uppercase">Mis Proyectos</h1>
          <p className="text-sipo-slate text-sm">Gestiona y consulta el estado de tus obras en curso.</p>
        </div>
        <button 
          onClick={() => navigate('/obras/nueva')}
          className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-sipo-orange/20"
        >
          <Plus size={20} />
          Nueva Obra
        </button>
      </header>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-sipo-border shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sipo-slate-light" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre de obra o cliente..."
            className="w-full pl-10 pr-4 py-2.5 bg-sipo-surface border border-sipo-border rounded-xl focus:border-sipo-orange outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-sipo-surface border border-sipo-border px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-sipo-orange"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="borrador">Borrador</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>


      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-sipo-orange" size={40} />
          <p className="text-sipo-slate font-medium">Sincronizando con el servidor...</p>
        </div>
      ) : (obras || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-sipo-border">
           <div className="w-20 h-20 bg-sipo-surface rounded-full flex items-center justify-center mb-4">
            <Building2 size={32} className="text-sipo-slate-light" />
          </div>
          <p className="text-sipo-slate font-medium">No se encontraron obras coincidentes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObras.map((obra) => (
            <div 
              key={obra.id}
              onClick={() => navigate(`/obras/${obra.id}/partidas`)}
              className="bg-white rounded-2xl border border-sipo-border p-6 shadow-sm hover:shadow-md hover:border-sipo-orange/30 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusStyle(obra.estado)}`}>
                  {obra.estado || 'Borrador'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic uppercase line-clamp-1 group-hover:text-sipo-orange transition-colors">
                    {obra.nombre || 'PROYECTO SIN NOMBRE'}
                  </h3>
                  <p className="text-[11px] uppercase tracking-wider text-sipo-slate font-bold mt-1">
                    {obra.cliente?.nombre || 'CLIENTE NO DEFINIDO'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sipo-slate text-[13px]">
                    <MapPin size={14} className="text-sipo-orange-light" />
                    <span className="truncate">
                      {obra.municipios?.nombre ? `${obra.municipios.nombre}, ${obra.departamentos?.nombre}` : 'Ubicación no definida'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sipo-slate text-[13px]">
                    <Calendar size={14} className="text-sipo-orange-light" />
                    <span>Inicia: {obra.fecha_inicio ? new Date(obra.fecha_inicio).toLocaleDateString() : 'Por definir'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-sipo-border flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase text-sipo-slate-light font-bold">Presupuesto</p>
                    <p className="text-lg font-barlow font-bold text-sipo-orange">
                      {formatCOP(obra.presupuesto_total)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-sipo-orange/5 flex items-center justify-center text-sipo-orange group-hover:bg-sipo-orange group-hover:text-white transition-all">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObrasList;
