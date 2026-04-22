import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Loader2,
  HardHat,
  BarChart3,
  Coins
} from 'lucide-react';
import { formatCOP } from '../utils/format';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <div className="bg-white p-6 rounded-[12px] border border-sipo-border shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-1 h-full ${color}`}></div>
    <div className="flex justify-between items-start mb-4">
      <span className="text-[11px] uppercase tracking-[0.8px] font-bold text-sipo-slate">{title}</span>
      <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('bg-', 'bg-opacity-10 text-')}`}>
        <Icon size={18} />
      </div>
    </div>
    {loading ? (
      <div className="h-8 w-3/4 bg-gray-100 animate-pulse rounded"></div>
    ) : (
      <h3 className="font-barlow font-bold text-2xl text-sipo-carbon truncate">{value}</h3>
    )}
  </div>
);

const DashboardHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    obras_activas: 0,
    presupuesto_total: 0,
    pendientes: 0,
    finalizadas: 0
  });
  const [obras, setObras] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resumenRes, obrasRes] = await Promise.all([
          fetch(`http://localhost:3000/api/obras/dashboard/resumen?usuario_id=${user.id}`),
          fetch(`http://localhost:3000/api/obras/usuario/${user.id}`)
        ]);

        const resumenData = await resumenRes.json();
        const obrasData = await obrasRes.json();

        if (resumenData.success) setStats(resumenData.data);
        if (obrasData.success) setObras(obrasData.data || []);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) fetchData();
  }, [user.id]);


  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'activo') return 'bg-sipo-blue-bg text-sipo-blue';
    if (s === 'finalizado') return 'bg-sipo-green-bg text-sipo-green';
    return 'bg-amber-50 text-amber-600'; // Pendiente/Borrador
  };

  if (loading) {
    return (
      <div className="space-y-8 h-full flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-sipo-orange" size={48} />
        <p className="text-sipo-slate font-medium">Cargando tu dashboard SIPO...</p>
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
        <div className="w-24 h-24 bg-sipo-orange-bg rounded-full flex items-center justify-center mb-6">
          <HardHat size={48} className="text-sipo-orange" />
        </div>
        <h2 className="text-2xl font-barlow font-bold text-sipo-carbon mb-2">Aún no tienes obras creadas</h2>
        <p className="text-sipo-slate mb-8 max-w-sm text-center">
          Empieza hoy mismo a centralizar tus presupuestos y toma decisiones basadas en datos reales.
        </p>
        <button 
          onClick={() => navigate('/obras/nueva')}
          className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-sipo-orange/20"
        >
          <Plus size={20} />
          Crear primera obra
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Obras Activas" 
          value={stats.obras_activas} 
          icon={Building2} 
          color="bg-sipo-blue" 
        />
        <StatCard 
          title="Presupuesto Total" 
          value={formatCOP(stats.presupuesto_total)} 
          icon={Coins} 
          color="bg-sipo-orange" 
        />
        <StatCard 
          title="Pendientes" 
          value={stats.pendientes} 
          icon={Clock} 
          color="bg-amber-400" 
        />
        <StatCard 
          title="Finalizadas" 
          value={stats.finalizadas} 
          icon={CheckCircle2} 
          color="bg-sipo-green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabla de Obras */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-sipo-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-sipo-border flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic">Listado de Obras</h3>
            <Link 
              to="/obras/nueva" 
              className="bg-sipo-orange hover:bg-sipo-orange-dark text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              Nueva Obra
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sipo-surface border-b border-sipo-border">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-sipo-slate">Obra</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-sipo-slate">Cliente</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-sipo-slate">Ubicación</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-sipo-slate">Presupuesto</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-sipo-slate text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sipo-border">
                {obras.map((obra) => (
                  <tr 
                    key={obra.id} 
                    onClick={() => navigate(`/obras/${obra.id}/partidas`)}
                    className="hover:bg-sipo-orange-bg cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-sipo-carbon group-hover:text-sipo-orange-dark transition-colors">{obra.nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-sipo-slate-light mt-0.5">{obra.tipo || 'Residencial'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[13px] ${!obra.cliente?.nombre ? 'text-sipo-slate-light italic' : 'text-sipo-slate'}`}>
                        {obra.cliente?.nombre || 'Sin cliente'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[13px] text-sipo-slate">
                        {(obra.municipios?.nombre && obra.departamentos?.nombre) 
                          ? `${obra.municipios.nombre}, ${obra.departamentos.nombre}` 
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`font-medium ${!obra.presupuesto_total ? 'text-sipo-slate-light' : 'text-sipo-carbon font-bold'}`}>
                        {formatCOP(obra.presupuesto_total)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${getStatusStyle(obra.estado)}`}>
                        {obra.estado || 'Borrador'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Estado de Obras */}
        <div className="bg-sipo-carbon rounded-2xl p-6 shadow-xl h-fit border-b-[3px] border-sipo-orange">
          <h3 className="font-barlow font-bold text-xl text-sipo-cream mb-6 flex items-center gap-2 italic">
            <BarChart3 size={20} className="text-sipo-orange" />
            Estado de Obras
          </h3>
          <div className="space-y-6">
            {obras.slice(0, 5).map((obra) => (
              <div key={obra.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sipo-cream font-medium truncate max-w-[150px]">{obra.nombre}</span>
                  <span className="text-sipo-orange-light font-bold">{obra.avance || 0}%</span>
                </div>
                <div className="h-1.5 bg-sipo-slate-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sipo-orange rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(230,126,34,0.3)]"
                    style={{ width: `${obra.avance || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {obras.length > 5 && (
              <p className="text-center text-[10px] uppercase text-sipo-slate-light tracking-widest pt-2">
                + {obras.length - 5} obras adicionales
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
