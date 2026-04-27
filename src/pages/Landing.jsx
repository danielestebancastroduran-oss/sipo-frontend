import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  console.log("🏠 [DEBUG] Renderizando Landing Page");
  return (
    <div className="min-h-screen bg-sipo-cream">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-sipo-charcoal text-white shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-sipo-orange rounded-lg flex items-center justify-center font-bold text-xl">S</div>
          <span className="text-2xl font-bold tracking-tight">SIPO</span>
        </div>
        <div className="space-x-8 hidden md:flex items-center">
          <a href="#quienes-somos" className="hover:text-sipo-orange transition-colors">Quiénes Somos</a>
          <Link to="/login" className="hover:text-sipo-orange transition-colors">Iniciar Sesión</Link>
          <Link to="/register" className="bg-sipo-orange px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition-all shadow-lg active:scale-95">
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-sipo-charcoal opacity-90 z-0"></div>
        {/* Background Animation shapes */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sipo-orange opacity-20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sipo-orange opacity-10 rounded-full blur-[100px] animate-pulse delay-700"></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Optimiza tu <span className="text-sipo-orange">Obra</span> <br />en tiempo real.
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            La plataforma definitiva para el control total de inventarios, proveedores y presupuestos en la construcción.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-sipo-orange text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-orange-600 transition-all shadow-xl hover:translate-y-[-2px] active:scale-95">
              Empieza ahora gratis
            </Link>
            <a href="#quienes-somos" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-white/20 transition-all">
              Saber más
            </a>
          </div>
        </div>
      </section>

      {/* Quienes Somos Section */}
      <section id="quienes-somos" className="py-24 px-6 md:px-20 bg-sipo-cream">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="inline-block px-4 py-1 bg-sipo-orange/10 text-sipo-orange font-semibold rounded-full mb-4">
                ¿Quiénes Somos?
              </div>
              <h2 className="text-4xl font-bold text-sipo-charcoal mb-6 leading-tight">
                Liderando la Transformación Digital en Construcción
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                SIPO es una plataforma integral diseñada para optimizar la gestión de obras y proyectos de construcción. Nos enfocamos en centralizar el control de inventarios, proveedores y presupuestos para que los ingenieros y constructores puedan tomar decisiones basadas en datos reales y en tiempo real.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-sipo-orange/20 p-2 rounded-lg text-sipo-orange">✓</div>
                  <div>
                    <h4 className="font-bold text-sipo-charcoal">Control Total</h4>
                    <p className="text-sm text-gray-500">Monitoreo de cada recurso utilizado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-sipo-orange/20 p-2 rounded-lg text-sipo-orange">✓</div>
                  <div>
                    <h4 className="font-bold text-sipo-charcoal">Datos en Tiempo Real</h4>
                    <p className="text-sm text-gray-500">Reportes precisos al instante.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="glass p-8 rounded-3xl border-sipo-orange/20 relative z-10">
                <div className="aspect-video bg-sipo-charcoal/5 rounded-2xl flex items-center justify-center p-4">
                  {/* Decorative element or Image */}
                  <div className="w-full h-full border-2 border-dashed border-sipo-orange/30 rounded-xl flex items-center justify-center text-sipo-orange/40 font-bold italic">
                    [ Imagen de Panel de Control SIPO ]
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        <div className={`w-full h-full bg-sipo-orange/${i}0`}></div>
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-sipo-orange flex items-center justify-center text-white text-xs font-bold">+100</div>
                  </div>
                  <span className="text-sm font-medium text-gray-500 italic">Ingenieros confían en SIPO</span>
                </div>
              </div>
              {/* Decorative square */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-sipo-orange/10 rounded-2xl -z-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sipo-charcoal py-12 px-6 text-center text-gray-400 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-sipo-orange rounded-md flex items-center justify-center font-bold text-white">S</div>
          <span className="text-xl font-bold text-white tracking-tight">SIPO</span>
        </div>
        <p>© 2024 SIPO. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;
