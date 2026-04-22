import React from 'react';
import { Check } from 'lucide-react';

const TabProgreso = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'Crear obra' },
    { id: 2, label: 'Partidas' },
    { id: 3, label: 'APU' },
    { id: 4, label: 'Costos indirectos' },
    { id: 5, label: 'Presupuesto' }
  ];

  return (
    <div className="flex items-center w-full bg-white border-b border-sipo-border mb-8 overflow-x-auto no-scrollbar">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        
        return (
          <div 
            key={step.id} 
            className={`flex items-center min-w-fit px-6 py-4 relative transition-all ${
              isActive ? 'border-b-[3px] border-sipo-orange bg-sipo-orange-bg/20' : 
              isCompleted ? 'border-b-[3px] border-sipo-green' : 'border-b-[3px] border-transparent'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mr-3 ${
              isActive ? 'bg-sipo-orange text-white' : 
              isCompleted ? 'bg-sipo-green text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {isCompleted ? <Check size={14} /> : step.id}
            </div>
            <span className={`text-[13px] font-bold whitespace-nowrap ${
              isActive ? 'text-sipo-orange' : 
              isCompleted ? 'text-sipo-green' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
            
            {index < steps.length - 1 && (
              <span className="mx-4 text-gray-200 font-light">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabProgreso;
