import React from 'react';
import { useLocation } from 'react-router-dom';

const Topbar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/obras')) return 'Mis Obras';
    if (path.startsWith('/configuracion')) return 'Configuración';
    return 'Inicio';
  };

  const sectionName = getBreadcrumb();

  return (
    <header className="h-[56px] w-full bg-sipo-carbon text-sipo-cream flex items-center justify-between px-6 border-b-[3px] border-sipo-orange fixed top-0 z-50">
      {/* Izquierda: Branding */}
      <div className="flex items-center gap-3">
        <div className="w-[34px] h-[34px] bg-sipo-orange rounded flex items-center justify-center font-barlow font-bold text-xl text-white">
          S
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-barlow font-bold text-xl tracking-tight">
            SI<span className="text-sipo-orange">PO</span>
          </span>
          <span className="text-[9px] uppercase text-sipo-slate-light font-medium tracking-widest">
            Presupuestos de Obra
          </span>
        </div>
      </div>

      {/* Centro: Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-dmsans">
        <span className="text-sipo-slate-light">Mis Obras</span>
        <span className="text-sipo-slate-light">›</span>
        <span className="text-sipo-orange-light font-medium">{sectionName}</span>
      </div>

      {/* Derecha: Usuario */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[13px] font-bold leading-none">{user.nombre || 'Usuario'} {user.apellido || ''}</p>
          <p className="text-[11px] text-sipo-slate-light uppercase mt-1 tracking-wider">{user.rol || 'Arquitecto'}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-sipo-orange flex items-center justify-center font-barlow font-bold text-white border border-white/20 uppercase">
          {user.nombre?.charAt(0) || 'U'}{user.apellido?.charAt(0) || ''}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
