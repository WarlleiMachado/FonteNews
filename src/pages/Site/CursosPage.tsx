import React from 'react';
import CursosLegacySlider from '../../components/Cursos/CursosLegacySlider';

const CursosPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-jkd-text mb-4">Cursos</h1>
        <div className="mt-4">
          <CursosLegacySlider heightPx={380} />
        </div>
        <div className="mt-8">
          <p className="text-jkd-text/80">Mais conteúdos de cursos serão adicionados em breve.</p>
        </div>
      </div>
    </div>
  );
};

export default CursosPage;