import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Send, 
  CheckCircle2, 
  ChevronLeft,
  Briefcase,
  Printer,
  Loader2
} from 'lucide-react';
import TabProgreso from '../../../components/TabProgreso';
import Toast from '../../../components/Toast';

const Step5Presupuesto = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [obra, setObra] = useState(null);
  const [detailLevel, setDetailLevel] = useState('partidas'); // ejecutivo, partidas, apu
  const [showToast, setShowToast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // En el plan, mencionamos que se obtendría el presupuesto consolidado
        const res = await fetch(`http://localhost:3000/api/obras/${id}/partidas`);
        const data = await res.json();
        if (data.success) setObra(data.data);
      } catch (err) {
        console.error('Error cargando presupuesto:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

  const detailOptions = [
    { id: 'ejecutivo', label: 'Resumen Ejecutivo', desc: 'Solo totales y AIU' },
    { id: 'partidas', label: 'Detalle por Partidas', desc: 'Cantidades y unitarios' },
    { id: 'apu', label: 'APU Completo', desc: 'Desglose total de recursos' }
  ];

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-sipo-orange" size={40} /></div>;

  // Valores calculados desde los datos reales de la obra
  const costoDirecto = obra?.total_directo || 0;
  
  // Obtener costos indirectos reales
  const costosInd = obra?.costos_indirectos || [];
  const adminItems = costosInd.filter(c => c.tipo === 'administracion');
  const adminVal = adminItems.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
  
  const impObj = costosInd.find(c => c.tipo === 'imprevisto');
  const utilObj = costosInd.find(c => c.tipo === 'utilidad');
  
  const pImp = impObj ? (impObj.porcentaje || 0) : 0;
  const pUtil = utilObj ? (utilObj.porcentaje || 0) : 0;
  
  const imprevistos = costoDirecto * (pImp / 100);
  const utilidad = costoDirecto * (pUtil / 100);
  
  const subtotalAIU = adminVal + imprevistos + utilidad;
  const totalGral = costoDirecto + subtotalAIU;

  return (
    <div className="animate-fade-in pb-20">
      <TabProgreso currentStep={5} />

      <div className="max-w-[1000px] mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link to={`/obras/${id}/costos`} className="text-xs font-bold text-sipo-orange flex items-center gap-1 mb-2 hover:underline">
              <ChevronLeft size={14} /> Volver a costos
            </Link>
            <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic uppercase">Consolidado Presupuestal</h1>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => {
                 setShowToast({ message: 'Borrador guardado correctamente', type: 'success' });
                 setTimeout(() => navigate('/obras'), 1500);
               }}
               className="text-sipo-slate font-bold px-4 py-2 hover:text-sipo-carbon transition-colors"
             >
               Guardar borrador
             </button>
             <button 
               onClick={() => setShowToast({ message: 'Preparando envío por correo al cliente...', type: 'success' })}
               className="bg-sipo-green text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-sipo-green/20 flex items-center gap-2 hover:bg-green-700 transition-all"
             >
                <Send size={18} />
                Enviar al cliente
             </button>
          </div>
        </header>

        {/* Banner superior consolidado */}
        <div className="bg-sipo-carbon rounded-3xl p-10 flex flex-col md:flex-row justify-between items-center border-b-[6px] border-sipo-orange shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <FileText size={160} className="text-white" />
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
               <Briefcase size={40} className="text-sipo-orange" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[3px] text-sipo-orange font-bold uppercase">Nombre de tu empresa</p>
              <h2 className="text-3xl font-barlow font-bold text-white italic tracking-tight">{obra?.nombre || 'Obra sin nombre'}</h2>
              <p className="text-sipo-slate-light text-sm mt-1">{obra?.cliente?.nombre || 'Cliente Particular'} · {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-8 md:mt-0 text-center md:text-right relative z-10">
            <p className="text-[10px] uppercase tracking-[3px] text-sipo-slate-light font-bold">Inversión Total Proyecto</p>
            <h3 className="text-5xl font-barlow font-bold text-sipo-orange mt-1 tracking-tighter">
              {formatCOP(totalGral)}
            </h3>
          </div>
        </div>

        {/* Selector de nivel de detalle */}
        <section className="space-y-4">
           <div className="flex items-center gap-2">
             <Printer size={18} className="text-sipo-orange" />
             <label>Configuración de exportación (Nivel de detalle)</label>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {detailOptions.map(opt => (
               <div 
                 key={opt.id}
                 onClick={() => setDetailLevel(opt.id)}
                 className={`p-6 bg-white border-2 rounded-2xl cursor-pointer transition-all ${
                   detailLevel === opt.id ? 'border-sipo-orange shadow-lg' : 'border-sipo-border hover:border-gray-300'
                 }`}
               >
                 <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${detailLevel === opt.id ? 'text-sipo-orange' : 'text-sipo-slate-light'}`}>
                      {opt.id === 'partidas' ? 'Recomendado' : 'Opción'}
                    </span>
                    {detailLevel === opt.id && <CheckCircle2 size={16} className="text-sipo-orange" />}
                 </div>
                 <p className={`font-bold ${detailLevel === opt.id ? 'text-sipo-carbon' : 'text-sipo-slate'}`}>{opt.label}</p>
                 <p className="text-xs text-sipo-slate-light mt-1">{opt.desc}</p>
               </div>
             ))}
           </div>
        </section>

        {/* Tabla completa de presupuesto */}
        <div className="bg-white rounded-3xl border border-sipo-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-sipo-surface border-b border-sipo-border">
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest font-bold text-sipo-slate">Item</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest font-bold text-sipo-slate">Descripción del concepto</th>
                <th className="px-4 py-5 text-[11px] uppercase tracking-widest font-bold text-sipo-slate text-center">Und.</th>
                <th className="px-4 py-5 text-[11px] uppercase tracking-widest font-bold text-sipo-slate text-right">Cant.</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest font-bold text-sipo-slate text-right">V. Unitario</th>
                <th className="px-8 py-5 text-[11px] uppercase tracking-widest font-bold text-sipo-slate text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {obra?.partidas?.map((p, index) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-8 py-4 font-bold text-sipo-orange">{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="px-8 py-4 font-medium text-sipo-carbon">{p.nombre}</td>
                  <td className="px-4 py-4 text-center text-sipo-slate">{p.unidad}</td>
                  <td className="px-4 py-4 text-right font-medium">{p.cantidad}</td>
                  <td className="px-8 py-4 text-right text-sipo-slate">{formatCOP(p.valor_unitario || 0)}</td>
                  <td className="px-8 py-4 text-right font-bold text-sipo-carbon">{formatCOP(p.total || 0)}</td>
                </tr>
              ))}
              
              {/* Totales */}
              <tr className="bg-sipo-surface/50 font-bold">
                <td colSpan="5" className="px-8 py-4 text-right uppercase tracking-wider text-sipo-slate text-[11px]">Subtotal Costos Directos</td>
                <td className="px-8 py-4 text-right text-sipo-carbon">{formatCOP(costoDirecto)}</td>
              </tr>
              
              {/* Administración */}
              <tr className="bg-sipo-orange-bg/10 border-white">
                <td colSpan="5" className="px-8 py-3 text-right uppercase tracking-[2px] text-sipo-orange-dark text-[11px] font-bold">Administración Desglosada</td>
                <td className="px-8 py-3 text-right text-sipo-orange font-bold">{formatCOP(adminVal)}</td>
              </tr>
              
              {/* Imprevistos y Utilidad */}
              <tr>
                <td colSpan="5" className="px-8 py-3 text-right uppercase tracking-wider text-sipo-slate text-[11px] font-bold italic">Imprevistos ({pImp}%)</td>
                <td className="px-8 py-3 text-right text-sipo-carbon font-medium">{formatCOP(imprevistos)}</td>
              </tr>
              <tr>
                <td colSpan="5" className="px-8 py-3 text-right uppercase tracking-wider text-sipo-slate text-[11px] font-bold italic">Utilidad ({pUtil}%)</td>
                <td className="px-8 py-3 text-right text-sipo-carbon font-medium">{formatCOP(utilidad)}</td>
              </tr>

              {/* Total final */}
              <tr className="bg-sipo-carbon text-white">
                <td colSpan="5" className="px-8 py-6 text-right uppercase tracking-[4px] text-sipo-orange font-bold text-sm italic">Presupuesto Total Proyecto</td>
                <td className="px-8 py-6 text-right">
                  <span className="text-3xl font-barlow font-bold text-sipo-orange animate-pulse">
                    {formatCOP(totalGral)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="p-8 flex justify-center bg-white">
             <button 
               onClick={() => setShowToast({ message: 'Generando PDF Oficial... la descarga iniciará en breve', type: 'success' })}
               className="bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-4 px-12 rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-sipo-orange/30 active:scale-95 text-lg"
             >
                <Download size={22} />
                Descargar PDF Oficial
             </button>
          </div>
        </div>
        {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
      </div>
    </div>
  );
};

export default Step5Presupuesto;
