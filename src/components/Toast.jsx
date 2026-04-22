import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 bg-sipo-carbon text-sipo-cream p-4 rounded-xl shadow-2xl border-l-4 animate-slide-up ${
      type === 'success' ? 'border-sipo-green' : 'border-sipo-red'
    }`}>
      <div className={type === 'success' ? 'text-sipo-green' : 'text-sipo-red'}>
        {type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold tracking-wide">{message}</p>
        <p className="text-[10px] text-sipo-slate-light uppercase mt-0.5">SIPO Notificación</p>
      </div>
      <button onClick={onClose} className="text-sipo-slate hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
