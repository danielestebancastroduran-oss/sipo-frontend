import React from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  ListTodo, 
  Wrench, 
  Coins, 
  BarChart3, 
  Users, 
  Package, 
  Hammer, 
  Settings2,
  Briefcase,
  Receipt,
  Printer
} from 'lucide-react';

const Sidebar = () => {
  const { id } = useParams();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const storedObraId = localStorage.getItem('obraActivaId');

  // Determinar si hay una obra activa (si estamos en una ruta de obra con ID)
  const isWorkSelected = id || location.pathname.includes('/obras/') || storedObraId;
  const activeWorkId = id || (location.pathname.startsWith('/obras/') ? location.pathname.split('/')[2] : null) || storedObraId;

  const NavItem = ({ to, icon: Icon, label, badge }) => (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex items-center justify-between px-4 py-3 transition-all duration-200 group ${
          isActive 
            ? 'bg-sipo-orange-bg text-sipo-orange-light border-l-[3px] border-sipo-orange' 
            : 'text-sipo-slate-light hover:bg-sipo-slate-bg hover:text-sipo-cream'
        }`
      }
    >
      <div className="flex items-center gap-3">
        <Icon size={26} className="transition-transform group-hover:scale-110" />
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      {badge && (
        <span className="bg-sipo-orange text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  );

  const SectionLabel = ({ label }) => (
    <div className="px-5 mt-6 mb-2">
      <span className="text-[11px] uppercase tracking-[0.8px] text-sipo-slate font-bold">
        {label}
      </span>
    </div>
  );

  return (
    <aside className="w-[240px] bg-sipo-carbon h-screen fixed pt-[56px] left-0 flex flex-col z-40">
      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        
        <SectionLabel label="Principal" />
        <NavItem to="/dashboard" icon={Home} label="Dashboard" />
        <NavItem to="/obras" icon={Building2} label="Mis Obras" badge="0" />

        {isWorkSelected && (
          <>
            <SectionLabel label="Flujo de Obra" />
            <NavItem to={`/obras/${activeWorkId}/partidas`} icon={ListTodo} label="Partidas" />
            <NavItem to={`/obras/${activeWorkId}/apu`} icon={Wrench} label="APU" />
            <NavItem to={`/obras/${activeWorkId}/costos`} icon={Coins} label="Costos indirectos" />
            <NavItem to={`/obras/${activeWorkId}/presupuesto`} icon={BarChart3} label="Presupuesto final" />
          </>
        )}

        <SectionLabel label="Catálogo" />
        <NavItem to="/configuracion?tab=cuadrillas" icon={Users} label="Cuadrillas" />
        <NavItem to="/configuracion?tab=materiales" icon={Package} label="Materiales" />
        <NavItem to="/configuracion?tab=herramienta" icon={Hammer} label="Herramienta menor" />
        <NavItem to="/configuracion?tab=equipos" icon={Settings2} label="Equipos" />

        <SectionLabel label="Configuración" />
        <NavItem to="/configuracion?tab=empresa" icon={Briefcase} label="Mi empresa" />
        <NavItem to="/configuracion?tab=retenciones" icon={Receipt} label="Retenciones" />
        <NavItem to="/configuracion?tab=impresion" icon={Printer} label="Impresión" />
      </div>

      {/* Footer del Sidebar */}
      <div className="p-4 bg-[#262B2C]/50 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sipo-orange/20 flex items-center justify-center text-sipo-orange font-bold text-sm">
            {user.nombre?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[12px] font-bold text-sipo-cream truncate">{user.nombre || 'Usuario'}</p>
            <p className="text-[10px] text-sipo-slate-light truncate uppercase tracking-tighter">{user.rol || 'Arquitecto'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
