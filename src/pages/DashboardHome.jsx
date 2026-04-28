import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Clock, 
  HardHat,
  BarChart3,
  Coins
} from 'lucide-react';
import { formatCOP } from '../utils/format';
import { authFetch } from '../services/apiFetch'; // Importación correcta

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
        // Usamos authFetch en lugar de fetch. 
        // Nota: Ajusta el endpoint si tu backend tiene una ruta de resumen válida
        const [obrasData] = await Promise.all([
          authFetch(`/obras/usuario/${user.id}`)
        ]);

        if (obrasData.success) {
          const listado = obrasData.data || [];
          setObras(listado);
          
          // Calcular estadísticas desde el listado
          const activas = listado.filter(o => o.estado === 'activo').length;
          const pendientes = listado.filter(o => o.estado === 'borrador').length;
          const finalizadas = listado.filter(o => o.estado === 'finalizado').length;
          const totalPresupuesto = listado.reduce((acc, o) => acc + (Number(o.presupuesto_total) || 0), 0);
          
          setStats({
            obras_activas: activas,
            presupuesto_total: totalPresupuesto,
            pendientes: pendientes,
            finalizadas: finalizadas
          });
        }
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
    return 'bg-amber-50 text-amber-600';
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
        <button 
          onClick={() => navigate('/obras/nueva')}
          className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus size={20} />
          Crear primera obra
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Obras Activas" value={stats.obras_activas} icon={Building2} color="bg-sipo-blue" />
        <StatCard title="Presupuesto Total" value={formatCOP(stats.presupuesto_total)} icon={Coins} color="bg-sipo-orange" />
        <StatCard title="Pendientes" value={stats.pendientes} icon={Clock} color="bg-amber-400" />
        <StatCard title="Finalizadas" value={stats.finalizadas} icon={CheckCircle2} color="bg-sipo-green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-sipo-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-sipo-border flex justify-between items-center">
            <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic">Listado de Obras</h3>
            <Link to="/obras/nueva" className="bg-sipo-orange text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2">
              <Plus size={16} /> Nueva Obra
            </Link>
          </div>
          <table className="w-full text-left">
            <tbody className="divide-y divide-sipo-border">
              {obras.map((obra) => (
                <tr key={obra.id} onClick={() => navigate(`/obras/${obra.id}/partidas`)} className="hover:bg-sipo-orange-bg cursor-pointer">
                  <td className="px-6 py-5"><p className="font-bold">{obra.nombre}</p></td>
                  <td className="px-6 py-5">{obra.cliente?.nombre || 'Sin cliente'}</td>
                  <td className="px-6 py-5">{(obra.municipios?.nombre) ? `${obra.municipios.nombre}` : '—'}</td>
                  <td className="px-6 py-5">{formatCOP(obra.presupuesto_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;