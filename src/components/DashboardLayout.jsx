import React from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="grid grid-cols-[240px_1fr] grid-rows-[56px_1fr] min-h-screen bg-sipo-surface font-dmsans">
      {/* Topbar: Ocupa toda la fila superior */}
      <div className="col-span-2 contents print:hidden">
        <Topbar />
      </div>

      {/* Sidebar: Columna izquierda fija */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Contenido Principal: Columna derecha, desplazado por Topbar y Sidebar */}
      <main className="col-start-2 row-start-2 p-8 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
