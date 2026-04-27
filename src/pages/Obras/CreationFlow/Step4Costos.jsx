import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Info, 
  Calculator,
  ChevronLeft,
  Loader2,
  X,
  Check
} from 'lucide-react';
import TabProgreso from '../../../components/TabProgreso';
import { formatCOP, parseNum } from '../../../utils/format';
import { Link } from 'react-router-dom';

const Step4Costos = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [costoDirecto, setCostoDirecto] = useState(0);
  
  // Administración desglosada
  const [adminItems, setAdminItems] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ concepto: '', descripcion: '', valor: 0 });
  const [editingId, setEditingId] = useState(null);
  
  // Imprevistos y Utilidad
  const [porcentajes, setPorcentajes] = useState({
    imprevistos: 5,
    utilidad: 10
  });

  // Configuración Fiscal
  const [fiscalConfig, setFiscalConfig] = useState({
    iva_porcentaje: 19,
    ica_porcentaje: 0.966,
    reteica_porcentaje: 0,
    retencion_fuente: 0
  });

  useEffect(() => {
    if (id && id !== 'nueva') {
      localStorage.setItem('obraActivaId', id);
      fetchData();
    } else {
      // Si es una obra nueva, resetear estados para no ver datos viejos
      setCostoDirecto(0);
      setAdminItems([]);
      setLoading(false);
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (!id || id === 'nueva') {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Cargar partidas para calcular costo directo
      const partidasRes = await fetch(`http://localhost:3000/api/obras/${id}/partidas`, { headers });
      const partidasData = await partidasRes.json();
      
      if (partidasData.success) {
        const partidas = partidasData.data?.partidas || partidasData.data || [];
        const totalDirecto = partidas.reduce((sum, p) => 
          sum + ((Number(p.cantidad) || 0) * (Number(p.valor_unitario) || 0)), 0
        );
        setCostoDirecto(totalDirecto);
      }

      // Cargar costos indirectos por separado
      const costosRes = await fetch(`http://localhost:3000/api/obras/${id}/costos`, { headers });
      const costosData = await costosRes.json();
      
      if (costosData.success && costosData.data) {
        const admin = (costosData.data).filter(c => c.tipo === 'administracion');
        setAdminItems(admin);
        
        const imp = costosData.data.find(c => c.tipo === 'imprevisto');
        const util = costosData.data.find(c => c.tipo === 'utilidad');
        setPorcentajes({
          imprevistos: imp?.porcentaje || 5,
          utilidad: util?.porcentaje || 10
        });
      }
      // Cargar configuración fiscal del usuario
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        const fiscalRes = await fetch(`http://localhost:3000/api/configuracion-fiscal/usuario/${user.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const fiscalData = await fiscalRes.json();
        if (fiscalData.success) setFiscalConfig(fiscalData.data);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveNewItem = async () => {
    if (!newItem.concepto) return setIsAdding(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/obras/${id}/costos/admin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          descripcion: newItem.concepto,
          valor: parseNum(newItem.valor)
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdding(false);
        setNewItem({ concepto: '', descripcion: '', valor: 0 });
        fetchData();
      }
    } catch (err) {
      console.error('Error agregando ítem admin:', err);
    }
  };

  const removeAdminItem = async (itemId) => {
    if (!window.confirm('¿Eliminar este concepto?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/obras/${id}/costos/admin/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Error eliminando ítem admin:', err);
    }
  };

  const updateAIU = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/obras/${id}/costos`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(porcentajes)
      });
      fetchData(); // Recargar para ver el impacto en presupuesto_total
    } catch (err) {
      console.error('Error actualizando AIU:', err);
    }
  };

  const handleUpdateItem = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/obras/${id}/costos/admin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        setEditingId(null);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  // Cálculos en tiempo real basándose en lo que viene del backend y config fiscal
  const totalAdministracion = (adminItems || []).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const cd = Number(costoDirecto) || 0;
  const pImp = Number(porcentajes?.imprevistos) || 0;
  const pUtil = Number(porcentajes?.utilidad) || 0;

  const valorImprevistos = cd * (pImp / 100);
  const valorUtilidad = cd * (pUtil / 100);
  
  // Lógica fiscal
  const ivaSobreUtilidad = valorUtilidad * ((fiscalConfig?.iva_porcentaje || 19) / 100);
  const totalSinRetenciones = cd + totalAdministracion + valorImprevistos + valorUtilidad + ivaSobreUtilidad;
  
  const valorICA = totalSinRetenciones * ((fiscalConfig?.ica_porcentaje || 0) / 1000);
  const valorReteICA = valorICA * ((fiscalConfig?.reteica_porcentaje || 0) / 100);
  const valorRetefuente = totalSinRetenciones * ((fiscalConfig?.retencion_fuente || 0) / 100);

  const presupuestoTotal = totalSinRetenciones;

  console.log("🔍 [DEBUG] Renderizando Step4Costos", { cd, totalAdministracion, presupuestoTotal });

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-sipo-orange" size={40} /></div>;
  if (!costoDirecto && adminItems.length === 0) {
     // No mostramos error aún porque puede ser una obra nueva, pero si no hay partidas avisamos
  }

  return (
    <div className="pb-20">
      <TabProgreso currentStep={4} />

      <div className="max-w-[1200px] mx-auto space-y-8">
        <header>
          <Link to={`/obras/${id}/partidas`} className="text-xs font-bold text-sipo-orange flex items-center gap-1 mb-2 hover:underline">
            <ChevronLeft size={14} /> Volver a partidas
          </Link>
          <h1 className="text-3xl font-barlow font-bold text-sipo-carbon italic uppercase">Análisis de Costos Indirectos (AIU)</h1>
          <p className="text-sipo-slate text-sm">Define la administración, los imprevistos y la utilidad de tu proyecto.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Entradas */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Card Administración DESGLOSADA */}
            <div className="bg-white rounded-2xl border border-sipo-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-sipo-border flex justify-between items-center">
                <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic uppercase tracking-wide">Administración DESGLOSADA</h3>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="text-xs font-bold bg-sipo-orange-bg text-sipo-orange px-4 py-2 rounded-lg hover:bg-sipo-orange hover:text-white transition-all flex items-center gap-2"
                >
                  <Plus size={14} />
                  Agregar ítem
                </button>
              </div>
              <div className="divide-y divide-sipo-border">
                {adminItems.map((item) => (
                  <div key={item.id} className="group p-6 hover:bg-sipo-orange-bg/10 transition-colors flex flex-col md:flex-row gap-4 items-end">
                    {editingId === item.id ? (
                      <>
                        <div className="flex-1 space-y-3 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-sipo-slate">Concepto</label>
                              <input 
                                type="text" 
                                className="w-full mt-1 p-2.5 bg-sipo-surface border border-sipo-orange rounded-lg outline-none text-sm font-medium"
                                value={item.descripcion || item.concepto}
                                onChange={(e) => setAdminItems(items => items.map(i => i.id === item.id ? {...i, descripcion: e.target.value, concepto: e.target.value} : i))}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-sipo-slate">Detalles</label>
                              <input 
                                type="text" 
                                className="w-full mt-1 p-2.5 bg-sipo-surface border border-sipo-border rounded-lg outline-none text-sm"
                                value={item.detalles || ''}
                                onChange={(e) => setAdminItems(items => items.map(i => i.id === item.id ? {...i, detalles: e.target.value} : i))}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-32 lg:w-48 space-y-3">
                          <label className="text-[10px] uppercase font-bold text-sipo-slate">Valor (COP)</label>
                          <input 
                            type="number" 
                            className="w-full mt-1 p-2.5 bg-sipo-surface border border-sipo-orange rounded-lg outline-none text-sm font-bold text-right"
                            value={item.valor}
                            onChange={(e) => setAdminItems(items => items.map(i => i.id === item.id ? {...i, valor: e.target.value} : i))}
                          />
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleUpdateItem(item)} className="p-2.5 text-sipo-green hover:bg-sipo-green-bg rounded-lg"><Check size={18}/></button>
                           <button onClick={() => setEditingId(null)} className="p-2.5 text-sipo-slate hover:bg-gray-100 rounded-lg"><X size={18}/></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 space-y-1 w-full">
                          <p className="font-bold text-sipo-carbon">{item.descripcion || item.concepto}</p>
                          <p className="text-xs text-sipo-slate italic leading-tight">{item.detalles || 'Sin detalles adicionales'}</p>
                        </div>
                        <div className="w-full md:w-32 lg:w-48 text-right">
                          <p className="text-[10px] uppercase font-bold text-sipo-slate-light mb-1">Valor concepto</p>
                          <p className="font-barlow font-bold text-lg text-sipo-carbon">{formatCOP(item.valor)}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setEditingId(item.id)} className="p-2.5 text-sipo-blue hover:bg-sipo-blue-bg rounded-lg transition-colors"><Plus size={18} className="rotate-45" /></button>
                           <button onClick={() => removeAdminItem(item.id)} className="p-2.5 text-sipo-red hover:bg-sipo-red-bg rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Formulario Inline para Nuevo Ítem */}
                {isAdding && (
                  <div className="p-6 bg-sipo-orange-bg/10 border-sipo-orange/20 border-y flex flex-col md:flex-row gap-4 items-end animate-slide-up">
                    <div className="flex-1 space-y-3 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-sipo-orange">Nuevo Concepto</label>
                          <input 
                            type="text" autoFocus
                            placeholder="Ej. Papelería y copias"
                            className="w-full mt-1 p-2.5 bg-white border border-sipo-orange rounded-lg outline-none text-sm font-medium"
                            value={newItem.concepto}
                            onChange={(e) => setNewItem({...newItem, concepto: e.target.value, descripcion: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-sipo-slate">Detalles</label>
                          <input 
                            type="text" 
                            placeholder="Opcional..."
                            className="w-full mt-1 p-2.5 bg-white border border-sipo-border rounded-lg outline-none text-sm"
                            value={newItem.detalles}
                            onChange={(e) => setNewItem({...newItem, detalles: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-32 lg:w-48 space-y-3">
                      <label className="text-[10px] uppercase font-bold text-sipo-slate">Valor (COP)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 p-2.5 bg-white border border-sipo-border rounded-lg outline-none text-sm font-bold text-right"
                        value={newItem.valor}
                        onChange={(e) => setNewItem({...newItem, valor: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={saveNewItem} className="p-2.5 bg-sipo-orange text-white rounded-lg hover:bg-sipo-orange-dark transition-all"><Check size={18}/></button>
                       <button onClick={() => setIsAdding(false)} className="p-2.5 text-sipo-slate hover:bg-gray-100 rounded-lg"><X size={18}/></button>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-sipo-orange-bg/20 p-5 flex justify-between items-center group">
                <span className="text-[11px] uppercase font-bold text-sipo-orange tracking-widest leading-none">Subtotal Administración</span>
                <span className="text-xl font-barlow font-bold text-sipo-orange-dark">{formatCOP(totalAdministracion)}</span>
              </div>
            </div>

            {/* Card Imprevistos y Utilidad */}
            <div className="bg-white rounded-2xl border border-sipo-border shadow-sm p-8 space-y-8">
               <h3 className="font-barlow font-bold text-xl text-sipo-carbon italic uppercase tracking-wide">Imprevistos y Utilidad</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <label className="flex items-center gap-2">I — Imprevistos <Info size={14} className="text-sipo-blue" /></label>
                     <span className="text-xs font-bold text-sipo-orange">{porcentajes.imprevistos}%</span>
                   </div>
                    <input 
                       type="range" min="0" max="30" step="0.5"
                       className="w-full accent-sipo-orange"
                       value={porcentajes.imprevistos}
                       onChange={(e) => setPorcentajes({ ...porcentajes, imprevistos: Number(e.target.value) })}
                       onMouseUp={updateAIU}
                    />
                   <div className="p-3 bg-sipo-surface rounded-xl flex justify-between items-center text-[13px] border border-sipo-border">
                     <span className="text-sipo-slate">Valor calculado:</span>
                     <span className="font-bold text-sipo-carbon">{formatCOP(valorImprevistos)}</span>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <label className="flex items-center gap-2">U — Utilidad <Info size={14} className="text-sipo-blue" /></label>
                     <span className="text-xs font-bold text-sipo-green">{porcentajes.utilidad}%</span>
                   </div>
                    <input 
                       type="range" min="0" max="40" step="0.5"
                       className="w-full accent-sipo-green"
                       value={porcentajes.utilidad}
                       onChange={(e) => setPorcentajes({ ...porcentajes, utilidad: Number(e.target.value) })}
                       onMouseUp={updateAIU}
                    />
                   <div className="p-3 bg-sipo-surface rounded-xl flex justify-between items-center text-[13px] border border-sipo-border">
                     <span className="text-sipo-slate">Valor calculado:</span>
                     <span className="font-bold text-sipo-carbon">{formatCOP(valorUtilidad)}</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen */}
          <div className="space-y-6">
            <div className="bg-sipo-carbon p-8 rounded-2xl shadow-xl space-y-6 sticky top-[100px] border-b-[6px] border-sipo-orange transition-all hover:scale-[1.02]">
              <h3 className="font-barlow font-bold text-2xl text-sipo-cream italic border-b border-white/10 pb-4 flex items-center gap-2">
                <Calculator className="text-sipo-orange" size={24} />
                Resumen Económico
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-sipo-slate-light">Costo Directo Total</span>
                  <span className="text-sipo-cream font-medium">{formatCOP(costoDirecto)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-sipo-slate-light">Administración</span>
                  <span className="text-sipo-cream font-medium">{formatCOP(totalAdministracion)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-sipo-slate-light">Imprevistos ({porcentajes.imprevistos}%)</span>
                  <span className="text-sipo-cream font-medium">{formatCOP(valorImprevistos)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-sipo-slate-light">Utilidad ({porcentajes.utilidad}%)</span>
                  <span className="text-sipo-cream font-medium">{formatCOP(valorUtilidad)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-sipo-slate-light">IVA s/ Utilidad ({fiscalConfig?.iva_porcentaje || 0}%)</span>
                  <span className="text-sipo-cream font-medium">{formatCOP(ivaSobreUtilidad)}</span>
                </div>
                
                <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                   <div className="flex justify-between items-center text-[11px]">
                     <span className="text-gray-400">ICA Est. ({fiscalConfig?.ica_porcentaje || 0}‰)</span>
                     <span className="text-gray-300">-{formatCOP(valorICA)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px]">
                     <span className="text-gray-400">ReteFuente Est. ({fiscalConfig?.retencion_fuente || 0}%)</span>
                     <span className="text-gray-300">-{formatCOP(valorRetefuente)}</span>
                   </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[3px] text-sipo-orange font-bold">Presupuesto Total Estimado</span>
                  <span className="text-4xl font-barlow font-bold text-white tracking-tight leading-none">
                    {formatCOP(presupuestoTotal)}
                  </span>
                  <span className="text-[10px] text-sipo-slate-light italic mt-2 uppercase font-bold tracking-widest text-center">COP Moneda Colombiana</span>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/obras/${id}/presupuesto`)}
                className="w-full bg-sipo-orange hover:bg-sipo-orange-dark text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sipo-orange/40 flex items-center justify-center gap-3 active:scale-95 text-lg"
              >
                Ver presupuesto
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="p-4 bg-sipo-blue-bg/20 rounded-xl border border-sipo-blue/10 flex gap-3 items-start">
               <Info size={18} className="text-sipo-blue mt-0.5 shrink-0" />
               <p className="text-[11px] text-sipo-blue font-medium leading-relaxed italic">
                 Los porcentajes aplicados aquí recaen sobre el costo directo total. Cualquier cambio en las partidas actualizará estos valores automáticamente.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Costos;
