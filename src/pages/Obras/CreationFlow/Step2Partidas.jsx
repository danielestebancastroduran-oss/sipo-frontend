import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Plus, Trash2, Edit3, X } from 'lucide-react';
import TabProgreso from '../../../components/TabProgreso';
import { formatCOP, parseNum } from '../../../utils/format';
import { authFetch } from '../../../services/apiFetch';

const Step2Partidas = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [partidas, setPartidas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', unidad: 'm2', cantidad: '', valor_unitario: '', descripcion: ''
  });
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`/partidas/obra/${id}`);
      // Lógica validada con tu Controller: accedemos a response.data
      setPartidas(response?.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || id === 'nueva') {
      console.warn("⚠️ [DEBUG] ID inválido en Step 2, redirigiendo a Step 1");
      navigate('/obras/nueva');
      return;
    }
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        nombre: formData.nombre,
        unidad: formData.unidad,
        cantidad: parseNum(formData.cantidad),
        valor_unitario: parseNum(formData.valor_unitario),
        descripcion: formData.descripcion || '',
        obra_id: id
      };

      await authFetch(isEditing ? `/partidas/${selectedId}` : '/partidas', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(dataToSend)
      });

      setShowModal(false);
      setFormData({ nombre: '', unidad: 'm2', cantidad: '', valor_unitario: '', descripcion: '' });
      fetchData();
    } catch (err) {
      alert("Error al guardar la partida.");
    }
  };

  const startEdit = (p) => {
    setFormData(p);
    setSelectedId(p.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (pid) => {
    if (!window.confirm('¿Eliminar esta partida?')) return;
    try {
      await authFetch(`/partidas/${pid}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert("Error al eliminar.");
    }
  };
  console.log("ID actual detectado en el componente:", id);

  return (
    <div className="animate-fade-in pb-20 p-6">
      <TabProgreso currentStep={2} />
      <div className="max-w-[1200px] mx-auto space-y-6 mt-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Partidas</h1>
          <button onClick={() => { setIsEditing(false); setShowModal(true); }} className="bg-orange-500 text-white py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-orange-600">
            <Plus size={20} /> Nueva partida
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-4">Partida</th>
                  <th className="p-4">Unidad</th>
                  <th className="p-4">Cantidad</th>
                  <th className="p-4">V. Unitario</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partidas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-700">{p.nombre}</td>
                    <td className="p-4 text-gray-600">{p.unidad}</td>
                    <td className="p-4 text-gray-600">{p.cantidad}</td>
                    <td className="p-4 text-gray-600">
                      {p.valor_unitario > 0 ? formatCOP(p.valor_unitario) : (
                        <span className="text-xs text-orange-500 font-medium italic">Pendiente APU</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      {p.valor_unitario > 0 ? formatCOP(p.cantidad * p.valor_unitario) : '$ —'}
                    </td>
                    <td className="p-4 flex justify-center gap-3">
                      <button onClick={() => startEdit(p)} className="text-blue-500"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-8">
          <button 
            type="button" 
            onClick={() => {
              if (partidas.length === 0) {
                alert('⚠️ Debes crear al menos una partida antes de continuar al APU');
                return;
              }
              const primeraPartida = partidas[0];
              console.log(`✅ Navegando a APU - Obra: ${id}, Partida: ${primeraPartida.id}`);
              navigate(`/obras/${id}/partidas/${primeraPartida.id}/apu`);
            }}
            disabled={partidas.length === 0}
            className={`py-3 px-8 rounded-xl font-bold transition-all ${
              partidas.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {partidas.length === 0 ? '⚠️ Crea una partida primero' : 'Continuar a APU →'}
          </button>
        </div>
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-96 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">{isEditing ? 'Editar' : 'Nueva'} Partida</h2>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Nombre de la partida</label>
                <input type="text" placeholder="Ej. Mampostería de ladrillo" className="w-full mt-1 p-3 border rounded-xl" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Unidad</label>
                  <select 
                    className="w-full mt-1 p-3 border rounded-xl bg-white" 
                    required 
                    value={formData.unidad} 
                    onChange={e => setFormData({ ...formData, unidad: e.target.value })}
                  >
                    <option value="m2">m2 (Metro Cuadrado)</option>
                    <option value="m3">m3 (Metro Cúbico)</option>
                    <option value="ml">ml (Metro Lineal)</option>
                    <option value="kg">kg (Kilogramo)</option>
                    <option value="und">und (Unidad)</option>
                    <option value="glb">glb (Global)</option>
                    <option value="pto">pto (Punto)</option>
                    <option value="ton">ton (Tonelada)</option>
                    <option value="m">m (Metro)</option>
                    <option value="mes">mes (Mes)</option>
                    <option value="dia">dia (Día)</option>
                  </select>
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold text-gray-400">Cantidad</label>
                   <input type="number" step="0.01" placeholder="0.00" className="w-full mt-1 p-3 border rounded-xl" required value={formData.cantidad} onChange={e => setFormData({ ...formData, cantidad: e.target.value })} />
                   <p className="text-[9px] text-gray-400 mt-1 italic">Volumen total de obra.</p>
                </div>
              </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400">Valor Unitario (Estimado)</label>
                  <input type="number" placeholder="0" className="w-full mt-1 p-3 border rounded-xl font-bold text-orange-600" required value={formData.valor_unitario} onChange={e => setFormData({ ...formData, valor_unitario: e.target.value })} />
                  <p className="text-[9px] text-gray-400 mt-1 italic">Este es el precio de <b>una sola unidad</b>. Se multiplicará por la cantidad automáticamente.</p>
                </div>
              
              <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all mt-4">
                {isEditing ? 'Actualizar Partida' : 'Crear Partida'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2Partidas;