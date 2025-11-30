import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-8">
          <h1 className="text-3xl font-bold text-jkd-heading mb-6">Termos de Uso</h1>
          
          <div className="space-y-6 text-jkd-text">
            <h2 className="text-xl font-semibold text-jkd-heading">Regras de uso</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você deve respeitar as diretrizes e valores da Igreja Fonte de Vida.</li>
              <li>É proibido publicar conteúdo ilícito, ofensivo, enganoso ou que viole direitos de terceiros.</li>
              <li>Contas de líderes e administradores são pessoais e intransferíveis.</li>
              <li>Uso indevido poderá resultar em suspensão ou bloqueio de acesso.</li>
            </ul>

            <h2 className="text-xl font-semibold text-jkd-heading">Responsabilidade do usuário e do site</h2>
            <p>O usuário é responsável pelo conteúdo que publica e por manter a segurança de suas credenciais. O aplicativo envida esforços razoáveis para disponibilidade e segurança, mas não garante operação ininterrupta e está isento de falhas técnicas inevitáveis.</p>

            <h2 className="text-xl font-semibold text-jkd-heading">Direitos autorais</h2>
            <p>Todo o conteúdo, marcas, layouts e materiais do aplicativo são protegidos por direitos autorais e demais leis aplicáveis. É proibida a reprodução não autorizada. Conteúdos enviados pelos usuários permanecem de titularidade deles, concedendo ao aplicativo direito de exibição dentro da plataforma.</p>

            <h2 className="text-xl font-semibold text-jkd-heading">Isenções de responsabilidade</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>O aplicativo não se responsabiliza por decisões tomadas com base em informações publicadas por usuários.</li>
              <li>Links externos podem direcionar a sites de terceiros, fora do nosso controle.</li>
              <li>O aplicativo pode realizar manutenções programadas que afetem a disponibilidade.</li>
            </ul>

            <div className="text-sm">
              Consulte também a <Link to="/privacy" className="text-church-primary hover:underline">Política de Privacidade</Link> e a {' '}
              <Link to="/cookies" className="text-church-primary hover:underline">Política de Cookies</Link>.
            </div>

            <p className="pt-2 text-xs text-jkd-text/70">Última atualização: Outubro de 2025.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
